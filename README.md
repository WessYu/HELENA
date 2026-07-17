# Helena Fiorese Advogados Associados

Site institucional com áreas de atuação, equipe, formulários de contato, consulta de protocolo e painel administrativo local.

## Tecnologias

- HTML
- CSS
- JavaScript
- Python
- Armazenamento em JSON
- GitHub Pages

## Funcionalidades

- Navegação responsiva
- Apresentação do escritório e das áreas de atuação
- Formulário de contato
- Solicitação de análise jurídica com protocolo
- Consulta de protocolo por e-mail
- Inscrição em newsletter
- Painel administrativo para contatos e solicitações

## Estrutura

```txt
index.html
styles.css
script.js
admin.html
admin.css
admin.js
server.py
data/
assets/
```

## Executando localmente

A versão estática pode ser aberta pelo arquivo `index.html`.

Para usar os formulários e o painel administrativo:

```bash
python server.py
```

Acesse `http://127.0.0.1:4173`.

A chave administrativa pode ser configurada com:

```bash
HELENA_ADMIN_KEY="sua-chave-segura" python server.py
```

## Endpoints

- `GET /api/health`
- `GET /api/admin/summary`
- `POST /api/contact`
- `POST /api/newsletter`
- `POST /api/consultations`
- `POST /api/consultations/lookup`
- `POST /api/admin/consultations/update`

A publicação no GitHub Pages contém apenas a parte estática. Formulários e painel dependem do servidor local ou de um backend equivalente.

## Autor

Wess

[GitHub](https://github.com/WessYu)
