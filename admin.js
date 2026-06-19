const STORAGE_KEY = "helena_admin_access_key";
const ACCESS_FORM = document.querySelector("#admin-access-form");
const ACCESS_FEEDBACK = document.querySelector("#admin-access-feedback");
const LOGIN_SECTION = document.querySelector("#admin-login");
const DASHBOARD_SECTION = document.querySelector("#admin-dashboard");
const REFRESH_BUTTON = document.querySelector("#admin-refresh");
const LOGOUT_BUTTON = document.querySelector("#admin-logout");
const STATS_ROOT = document.querySelector("#admin-stats");
const CONTACTS_ROOT = document.querySelector("#admin-contacts");
const NEWSLETTER_ROOT = document.querySelector("#admin-newsletter");
const CONSULTATIONS_ROOT = document.querySelector("#admin-consultations");

const STATUS_OPTIONS = [
  "Recebido",
  "Em análise",
  "Em contato",
  "Documentação solicitada",
  "Em andamento",
  "Concluído",
  "Arquivado",
];

function getAccessKey() {
  return sessionStorage.getItem(STORAGE_KEY) || "";
}

function setAccessKey(value) {
  sessionStorage.setItem(STORAGE_KEY, value);
}

function clearAccessKey() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function setFeedback(element, type, message) {
  if (!element) {
    return;
  }

  element.textContent = message;
  element.className = `admin-feedback is-visible ${type === "success" ? "is-success" : "is-error"}`;
}

function clearFeedback(element) {
  if (!element) {
    return;
  }

  element.textContent = "";
  element.className = "admin-feedback";
}

async function fetchAdmin(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Key": getAccessKey(),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Não foi possível concluir a operação.");
  }
  return data;
}

function formatDate(value) {
  if (!value) {
    return "Sem data";
  }

  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function renderStats(counts) {
  const labels = {
    consultations: "solicitações",
    contacts: "mensagens",
    newsletter: "inscrições",
  };

  STATS_ROOT.innerHTML = [
    { label: "solicitações ativas", value: counts.consultations ?? 0 },
    { label: "mensagens recebidas", value: counts.contacts ?? 0 },
    { label: "inscrições na newsletter", value: counts.newsletter ?? 0 },
    { label: "atendimento organizado", value: "100%" },
  ]
    .map(
      (item) => `
        <article class="stat-card">
          <strong>${item.value}</strong>
          <span>${item.label}</span>
        </article>
      `,
    )
    .join("");
}

function renderEmpty(target, message) {
  target.innerHTML = `<div class="empty-state">${message}</div>`;
}

function renderContacts(items) {
  if (!items.length) {
    renderEmpty(CONTACTS_ROOT, "Nenhuma mensagem registrada até o momento.");
    return;
  }

  CONTACTS_ROOT.innerHTML = items
    .map(
      (item) => `
        <article class="admin-item">
          <div class="admin-item-header">
            <div>
              <h4>${item.name}</h4>
              <small>${item.email} • ${item.phone}</small>
            </div>
            <span class="pill status">${item.status}</span>
          </div>
          <p><strong>Assunto:</strong> ${item.subject}</p>
          <p>${item.message}</p>
          <small>Recebido em ${formatDate(item.createdAt)}</small>
        </article>
      `,
    )
    .join("");
}

function renderNewsletter(items) {
  if (!items.length) {
    renderEmpty(NEWSLETTER_ROOT, "Nenhuma inscrição registrada até o momento.");
    return;
  }

  NEWSLETTER_ROOT.innerHTML = items
    .map(
      (item) => `
        <article class="admin-item">
          <div class="admin-item-header">
            <div>
              <h4>${item.email}</h4>
              <small>Inscrição registrada em ${formatDate(item.createdAt)}</small>
            </div>
            <span class="pill status">${item.status}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function consultationTemplate(item) {
  const options = STATUS_OPTIONS.map(
    (status) => `<option value="${status}" ${status === item.status ? "selected" : ""}>${status}</option>`,
  ).join("");

  return `
    <article class="admin-item">
      <div class="admin-item-header">
        <div>
          <h4>${item.name}</h4>
          <small>${item.email} • ${item.phone}</small>
        </div>
        <div>
          <span class="pill status">${item.status}</span>
        </div>
      </div>

      <div class="admin-meta">
        <small><strong>Protocolo:</strong> ${item.protocol}</small>
        <small><strong>Área:</strong> ${item.area} • <strong>Urgência:</strong> ${item.urgency}</small>
        <small><strong>Canal preferido:</strong> ${item.preferredContact}</small>
        <small><strong>Entrada:</strong> ${formatDate(item.createdAt)}</small>
        ${item.updatedAt ? `<small><strong>Última atualização:</strong> ${formatDate(item.updatedAt)}</small>` : ""}
      </div>

      <p>${item.message}</p>

      <form class="update-form" data-protocol="${item.protocol}">
        <div class="update-form-grid">
          <label class="admin-field">
            <span>Status</span>
            <select name="status">${options}</select>
          </label>

          <label class="admin-field">
            <span>Próxima etapa</span>
            <input type="text" name="nextStep" value="${item.nextStep || ""}" required />
          </label>

          <button class="admin-button" type="submit">Salvar</button>
        </div>
        <div class="admin-feedback" aria-live="polite"></div>
      </form>
    </article>
  `;
}

function renderConsultations(items) {
  if (!items.length) {
    renderEmpty(CONSULTATIONS_ROOT, "Nenhuma solicitação registrada até o momento.");
    return;
  }

  CONSULTATIONS_ROOT.innerHTML = items.map(consultationTemplate).join("");

  CONSULTATIONS_ROOT.querySelectorAll(".update-form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const protocol = form.dataset.protocol;
      const status = form.querySelector('[name="status"]').value;
      const nextStep = form.querySelector('[name="nextStep"]').value.trim();
      const feedback = form.querySelector(".admin-feedback");
      const button = form.querySelector("button");

      clearFeedback(feedback);
      button.disabled = true;
      button.textContent = "Salvando...";

      try {
        await fetchAdmin("/api/admin/consultations/update", {
          method: "POST",
          body: JSON.stringify({ protocol, status, nextStep }),
        });
        setFeedback(feedback, "success", "Atualização salva com sucesso.");
        await loadDashboard();
      } catch (error) {
        setFeedback(feedback, "error", error.message);
      } finally {
        button.disabled = false;
        button.textContent = "Salvar";
      }
    });
  });
}

function showDashboard() {
  LOGIN_SECTION.classList.add("is-hidden");
  DASHBOARD_SECTION.classList.remove("is-hidden");
}

function showLogin() {
  DASHBOARD_SECTION.classList.add("is-hidden");
  LOGIN_SECTION.classList.remove("is-hidden");
}

async function loadDashboard() {
  const data = await fetchAdmin("/api/admin/summary");
  renderStats(data.counts || {});
  renderConsultations(data.recent?.consultations || []);
  renderContacts(data.recent?.contacts || []);
  renderNewsletter(data.recent?.newsletter || []);
  showDashboard();
}

if (ACCESS_FORM) {
  ACCESS_FORM.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearFeedback(ACCESS_FEEDBACK);
    const input = ACCESS_FORM.querySelector('[name="accessKey"]');
    const button = ACCESS_FORM.querySelector("button");
    const accessKey = input.value.trim();

    if (!accessKey) {
      setFeedback(ACCESS_FEEDBACK, "error", "Informe a chave de acesso.");
      return;
    }

    button.disabled = true;
    button.textContent = "Entrando...";
    setAccessKey(accessKey);

    try {
      await loadDashboard();
      input.value = "";
    } catch (error) {
      clearAccessKey();
      setFeedback(ACCESS_FEEDBACK, "error", error.message);
      showLogin();
    } finally {
      button.disabled = false;
      button.textContent = "Entrar no painel";
    }
  });
}

if (REFRESH_BUTTON) {
  REFRESH_BUTTON.addEventListener("click", async () => {
    REFRESH_BUTTON.disabled = true;
    REFRESH_BUTTON.textContent = "Atualizando...";
    try {
      await loadDashboard();
    } finally {
      REFRESH_BUTTON.disabled = false;
      REFRESH_BUTTON.textContent = "Atualizar";
    }
  });
}

if (LOGOUT_BUTTON) {
  LOGOUT_BUTTON.addEventListener("click", () => {
    clearAccessKey();
    showLogin();
  });
}

if (getAccessKey()) {
  loadDashboard().catch(() => {
    clearAccessKey();
    showLogin();
  });
}
