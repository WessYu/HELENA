from __future__ import annotations

import json
import os
import re
import threading
import unicodedata
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from uuid import uuid4


BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
FILES = {
    "contacts": DATA_DIR / "contacts.json",
    "newsletter": DATA_DIR / "newsletter.json",
    "consultations": DATA_DIR / "consultations.json",
}
ADMIN_ACCESS_KEY = os.environ.get("HELENA_ADMIN_KEY", "HF-Acesso-2026")
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"\D+")
LOCK = threading.Lock()
AREAS = {
    "Previdenciário",
    "Trabalhista",
    "Direito Civil",
    "Direito de Família",
    "Direito Tributário",
    "Revisional Bancária",
    "Internacional",
    "Ambiental e Holding",
}
PREFERRED_CONTACT = {"WhatsApp", "Telefone", "E-mail"}
URGENCY_LEVELS = {"Normal", "Alta", "Muito alta"}
CONSULTATION_STATUSES = {
    "Recebido",
    "Em análise",
    "Em contato",
    "Documentação solicitada",
    "Em andamento",
    "Concluído",
    "Arquivado",
}


def now_iso() -> str:
    return datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds")


def ensure_storage() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for file_path in FILES.values():
        if not file_path.exists():
            file_path.write_text("[]", encoding="utf-8")


def read_collection(name: str) -> list[dict[str, Any]]:
    file_path = FILES[name]
    try:
        data = json.loads(file_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        data = []
    return data if isinstance(data, list) else []


def write_collection(name: str, items: list[dict[str, Any]]) -> None:
    FILES[name].write_text(json.dumps(items, ensure_ascii=False, indent=2), encoding="utf-8")


def normalize_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).strip().split())


def normalize_multiline(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def sanitize_email(value: Any) -> str:
    return normalize_text(value).lower()


def sanitize_phone(value: Any) -> str:
    return PHONE_RE.sub("", normalize_text(value))


def canonicalize(value: Any) -> str:
    normalized = unicodedata.normalize("NFKD", normalize_text(value))
    normalized = "".join(char for char in normalized if not unicodedata.combining(char))
    return normalized.casefold()


def validate_email(value: str) -> bool:
    return bool(EMAIL_RE.match(value))


def validate_phone(value: str) -> bool:
    return len(value) >= 10


def make_protocol() -> str:
    return f"HF-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}"


def summary_payload() -> dict[str, Any]:
    contacts = read_collection("contacts")
    newsletter = read_collection("newsletter")
    consultations = read_collection("consultations")
    return {
        "status": "ok",
        "service": "helena-fiorese-backoffice",
        "timestamp": now_iso(),
        "counts": {
            "contacts": len(contacts),
            "newsletter": len(newsletter),
            "consultations": len(consultations),
        },
    }


def require_admin_access(headers: Any) -> None:
    access_key = normalize_text(headers.get("X-Admin-Key"))
    require(access_key == ADMIN_ACCESS_KEY, "Acesso administrativo não autorizado.", HTTPStatus.UNAUTHORIZED)


def build_admin_summary() -> dict[str, Any]:
    contacts = list(reversed(read_collection("contacts")))
    newsletter = list(reversed(read_collection("newsletter")))
    consultations = list(reversed(read_collection("consultations")))
    return {
        **summary_payload(),
        "recent": {
            "contacts": contacts,
            "newsletter": newsletter,
            "consultations": consultations,
        },
    }


class ApiError(Exception):
    def __init__(self, message: str, status: int = HTTPStatus.BAD_REQUEST) -> None:
        super().__init__(message)
        self.message = message
        self.status = status


def require(condition: bool, message: str, status: int = HTTPStatus.BAD_REQUEST) -> None:
    if not condition:
        raise ApiError(message, status)


def build_contact(payload: dict[str, Any]) -> dict[str, Any]:
    name = normalize_text(payload.get("name"))
    email = sanitize_email(payload.get("email"))
    phone = sanitize_phone(payload.get("phone"))
    subject = normalize_text(payload.get("subject"))
    message = normalize_multiline(payload.get("message"))

    require(len(name) >= 3, "Informe um nome válido.")
    require(validate_email(email), "Informe um e-mail válido.")
    require(validate_phone(phone), "Informe um telefone válido com DDD.")
    require(len(subject) >= 3, "Informe um assunto para o contato.")
    require(len(message) >= 12, "Descreva melhor a mensagem antes de enviar.")

    return {
        "id": uuid4().hex,
        "createdAt": now_iso(),
        "name": name,
        "email": email,
        "phone": phone,
        "subject": subject,
        "message": message,
        "status": "novo",
    }


def build_newsletter(payload: dict[str, Any]) -> dict[str, Any]:
    email = sanitize_email(payload.get("email"))
    require(validate_email(email), "Informe um e-mail válido para a newsletter.")
    return {
        "id": uuid4().hex,
        "createdAt": now_iso(),
        "email": email,
        "status": "ativo",
    }


def build_consultation(payload: dict[str, Any]) -> dict[str, Any]:
    name = normalize_text(payload.get("name"))
    email = sanitize_email(payload.get("email"))
    phone = sanitize_phone(payload.get("phone"))
    area = normalize_text(payload.get("area"))
    preferred_contact = normalize_text(payload.get("preferredContact"))
    urgency = normalize_text(payload.get("urgency"))
    message = normalize_multiline(payload.get("message"))
    consent = bool(payload.get("consent"))

    require(len(name) >= 3, "Informe o nome completo.")
    require(validate_email(email), "Informe um e-mail válido.")
    require(validate_phone(phone), "Informe um telefone válido com DDD.")
    area_map = {canonicalize(item): item for item in AREAS}
    contact_map = {canonicalize(item): item for item in PREFERRED_CONTACT}
    urgency_map = {canonicalize(item): item for item in URGENCY_LEVELS}

    require(canonicalize(area) in area_map, "Selecione uma área jurídica válida.")
    require(canonicalize(preferred_contact) in contact_map, "Selecione o canal preferido.")
    require(canonicalize(urgency) in urgency_map, "Selecione o nível de urgência.")
    require(len(message) >= 20, "Escreva um resumo um pouco mais completo do caso.")
    require(consent, "É necessário autorizar o uso dos dados para retorno.")

    return {
        "id": uuid4().hex,
        "protocol": make_protocol(),
        "createdAt": now_iso(),
        "name": name,
        "email": email,
        "phone": phone,
        "area": area_map[canonicalize(area)],
        "preferredContact": contact_map[canonicalize(preferred_contact)],
        "urgency": urgency_map[canonicalize(urgency)],
        "message": message,
        "consent": consent,
        "status": "Recebido",
        "nextStep": "Triagem inicial e retorno pelo canal preferido.",
    }


class HelenaHandler(SimpleHTTPRequestHandler):
    server_version = "HelenaFioreseHTTP/1.0"

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def log_message(self, format: str, *args: Any) -> None:
        timestamp = datetime.now().strftime("%d/%m/%Y %H:%M:%S")
        print(f"[{timestamp}] {self.address_string()} - {format % args}")

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self.send_json(summary_payload())
            return

        if parsed.path == "/api/admin/summary":
            try:
                require_admin_access(self.headers)
                self.send_json(build_admin_summary())
            except ApiError as exc:
                self.send_json({"ok": False, "message": exc.message}, status=exc.status)
            return

        if parsed.path in {"/painel-interno-hf", "/painel-interno-hf/", "/painel-reservado-hf.html"}:
            self.path = "/admin.html"

        if parsed.path == "/":
            self.path = "/index.html"
        super().do_GET()

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        try:
            payload = self.read_json_body()

            if parsed.path == "/api/contact":
                record = build_contact(payload)
                with LOCK:
                    contacts = read_collection("contacts")
                    contacts.append(record)
                    write_collection("contacts", contacts)
                self.send_json(
                    {
                        "ok": True,
                        "message": "Mensagem enviada com sucesso. O escritório poderá retornar em breve.",
                        "record": {"createdAt": record["createdAt"], "status": record["status"]},
                    },
                    status=HTTPStatus.CREATED,
                )
                return

            if parsed.path == "/api/newsletter":
                record = build_newsletter(payload)
                with LOCK:
                    subscribers = read_collection("newsletter")
                    already_exists = any(item.get("email") == record["email"] for item in subscribers)
                    require(not already_exists, "Este e-mail já está inscrito na newsletter.", HTTPStatus.CONFLICT)
                    subscribers.append(record)
                    write_collection("newsletter", subscribers)
                self.send_json(
                    {
                        "ok": True,
                        "message": "Inscrição confirmada com sucesso.",
                        "record": {"createdAt": record["createdAt"], "status": record["status"]},
                    },
                    status=HTTPStatus.CREATED,
                )
                return

            if parsed.path == "/api/consultations":
                record = build_consultation(payload)
                with LOCK:
                    consultations = read_collection("consultations")
                    consultations.append(record)
                    write_collection("consultations", consultations)
                self.send_json(
                    {
                        "ok": True,
                        "message": "Solicitação recebida com sucesso.",
                        "record": {
                            "protocol": record["protocol"],
                            "status": record["status"],
                            "nextStep": record["nextStep"],
                            "createdAt": record["createdAt"],
                        },
                    },
                    status=HTTPStatus.CREATED,
                )
                return

            if parsed.path == "/api/consultations/lookup":
                protocol = normalize_text(payload.get("protocol")).upper()
                email = sanitize_email(payload.get("email"))
                require(protocol, "Informe o protocolo.")
                require(validate_email(email), "Informe o e-mail usado na solicitação.")

                consultations = read_collection("consultations")
                record = next(
                    (
                        item
                        for item in consultations
                        if item.get("protocol", "").upper() == protocol and item.get("email") == email
                    ),
                    None,
                )
                require(record is not None, "Não encontramos uma solicitação com este protocolo e e-mail.", HTTPStatus.NOT_FOUND)
                self.send_json(
                    {
                        "ok": True,
                        "record": {
                            "protocol": record["protocol"],
                            "status": record["status"],
                            "area": record["area"],
                            "urgency": record["urgency"],
                            "createdAt": record["createdAt"],
                            "nextStep": record["nextStep"],
                        },
                    }
                )
                return

            if parsed.path == "/api/admin/consultations/update":
                require_admin_access(self.headers)
                protocol = normalize_text(payload.get("protocol")).upper()
                status = normalize_text(payload.get("status"))
                next_step = normalize_multiline(payload.get("nextStep"))
                status_map = {canonicalize(item): item for item in CONSULTATION_STATUSES}

                require(protocol, "Informe o protocolo da solicitação.")
                require(canonicalize(status) in status_map, "Informe um status válido.")
                require(len(next_step) >= 6, "Informe a próxima etapa ou orientação interna.")

                with LOCK:
                    consultations = read_collection("consultations")
                    record = next(
                        (item for item in consultations if item.get("protocol", "").upper() == protocol),
                        None,
                    )
                    require(record is not None, "Solicitação não encontrada para atualização.", HTTPStatus.NOT_FOUND)
                    record["status"] = status_map[canonicalize(status)]
                    record["nextStep"] = next_step
                    record["updatedAt"] = now_iso()
                    write_collection("consultations", consultations)

                self.send_json(
                    {
                        "ok": True,
                        "message": "Solicitação atualizada com sucesso.",
                        "record": {
                            "protocol": record["protocol"],
                            "status": record["status"],
                            "nextStep": record["nextStep"],
                            "updatedAt": record["updatedAt"],
                        },
                    }
                )
                return

            raise ApiError("Endpoint não encontrado.", HTTPStatus.NOT_FOUND)
        except ApiError as exc:
            self.send_json({"ok": False, "message": exc.message}, status=exc.status)
        except json.JSONDecodeError:
            self.send_json({"ok": False, "message": "JSON inválido no corpo da requisição."}, status=HTTPStatus.BAD_REQUEST)
        except Exception:
            self.send_json(
                {"ok": False, "message": "Ocorreu um erro interno ao processar a solicitação."},
                status=HTTPStatus.INTERNAL_SERVER_ERROR,
            )

    def read_json_body(self) -> dict[str, Any]:
        content_length = int(self.headers.get("Content-Length", "0"))
        require(content_length > 0, "Requisição sem conteúdo.")
        raw = self.rfile.read(content_length)
        payload = json.loads(raw.decode("utf-8"))
        require(isinstance(payload, dict), "O corpo da requisição deve ser um objeto JSON.")
        return payload

    def send_json(self, payload: dict[str, Any], status: int = HTTPStatus.OK) -> None:
        encoded = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(encoded)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(encoded)


def run() -> None:
    ensure_storage()
    port = int(os.environ.get("PORT", "4173"))
    server = ThreadingHTTPServer(("0.0.0.0", port), HelenaHandler)
    print(f"Site Helena Fiorese disponível em http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServidor encerrado.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
