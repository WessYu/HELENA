# Helena Fiorese Advogados Associados

Landing page institucional premium para o escritório **Helena Fiorese Advogados Associados**, com foco em presença digital, credibilidade, atendimento jurídico e captação organizada de contatos.

O projeto combina uma interface elegante, responsiva e sofisticada com seções estratégicas para apresentar o escritório, áreas de atuação, método de atendimento, depoimentos, formulário de análise jurídica, contato direto, newsletter e painel administrativo reservado.

---

## ✨ Visão geral

A proposta do site é transmitir confiança, sofisticação e clareza para um escritório jurídico com atuação previdenciária, estratégica e multidisciplinar.

O layout foi pensado para:

- apresentar o escritório de forma profissional;
- destacar as advogadas e suas credenciais;
- mostrar áreas de atuação com leitura objetiva;
- facilitar o primeiro contato pelo WhatsApp, telefone, e-mail e formulários;
- gerar protocolo de atendimento para solicitações jurídicas;
- permitir consulta de andamento por protocolo;
- disponibilizar um painel administrativo para acompanhar contatos, newsletter e solicitações.

---

## 🖥️ Tecnologias utilizadas

- **HTML5**
- **CSS3**
- **JavaScript vanilla**
- **Python 3** com `http.server`
- **JSON local** para armazenamento simples dos dados
- **GitHub Pages** para deploy da versão estática

---

## 📌 Funcionalidades

### Site institucional

- Hero premium com chamada principal e CTA.
- Navegação responsiva com menu mobile.
- Seção sobre o escritório.
- Cards de advogadas e posicionamento institucional.
- Marquee com áreas jurídicas.
- Grade de áreas de atuação.
- Seção de método de atendimento.
- Depoimentos.
- Bloco final de contato.
- Links para WhatsApp, telefone, e-mail, Instagram e Facebook.

### Formulários

- Solicitação de análise jurídica com geração de protocolo.
- Consulta de protocolo por e-mail.
- Formulário de contato direto.
- Inscrição em newsletter.
- Feedback visual de sucesso e erro.

### Painel administrativo

- Acesso reservado por chave administrativa.
- Listagem de contatos recebidos.
- Listagem de inscritos na newsletter.
- Listagem de solicitações de atendimento.
- Atualização de status e próxima etapa das solicitações.
- Resumo com contadores gerais.

---

## 📂 Estrutura principal

```txt
HELENA/
├── index.html                  # Página principal do site
├── styles.css                  # Estilos principais da landing page
├── script.js                   # Interações, formulários e animações
├── admin.html                  # Painel administrativo reservado
├── admin.css                   # Estilos do painel administrativo
├── admin.js                    # Lógica do painel administrativo
├── server.py                   # Servidor local com endpoints de API
├── data/
│   ├── consultations.json      # Solicitações de análise jurídica
│   ├── contacts.json           # Mensagens de contato
│   └── newsletter.json         # Inscrições da newsletter
├── assets/                     # Logos e imagens do projeto
└── .github/workflows/pages.yml # Deploy no GitHub Pages
```

---

## 🚀 Como rodar localmente

### Versão estática

Você pode abrir o `index.html` direto no navegador.

Essa forma serve para visualizar o layout, mas os formulários que dependem de `/api` não terão persistência real.

### Versão com backend local

Para usar formulários, protocolos e painel administrativo:

```bash
python server.py
```

Depois acesse:

```txt
http://127.0.0.1:4173
```

O servidor cria e usa os arquivos JSON dentro da pasta `data/` para salvar contatos, newsletter e solicitações de atendimento.

---

## 🔐 Painel administrativo

Com o servidor local ativo, acesse:

```txt
http://127.0.0.1:4173/painel-interno-hf
```

A chave administrativa pode ser configurada por variável de ambiente:

```bash
HELENA_ADMIN_KEY="sua-chave-segura" python server.py
```

> Para produção, não use chave fixa no código. Configure a variável de ambiente no servidor ou adapte para um sistema de autenticação mais seguro.

---

## 🔌 Endpoints locais

O `server.py` fornece os principais endpoints:

| Método | Endpoint | Função |
|---|---|---|
| `GET` | `/api/health` | Verifica status do serviço |
| `GET` | `/api/admin/summary` | Retorna resumo administrativo |
| `POST` | `/api/contact` | Salva contato direto |
| `POST` | `/api/newsletter` | Salva inscrição na newsletter |
| `POST` | `/api/consultations` | Cria solicitação e protocolo |
| `POST` | `/api/consultations/lookup` | Consulta protocolo por e-mail |
| `POST` | `/api/admin/consultations/update` | Atualiza status da solicitação |

---

## 🌐 Deploy

O projeto possui workflow para publicação no **GitHub Pages** a partir da branch:

```txt
feat/premium-frontend-redesign
```

A versão publicada pelo GitHub Pages entrega o front-end estático. Recursos que dependem de API, como formulários com armazenamento, consulta de protocolo e painel administrativo, precisam de um backend ativo para funcionar completamente.

---

## 🎨 Identidade visual

O visual segue uma linha:

- jurídica e sofisticada;
- tons elegantes e institucionais;
- tipografia serifada para autoridade;
- layout limpo e premium;
- animações suaves de entrada;
- experiência responsiva para desktop e celular.

---

## 📱 Responsividade

O site foi pensado para funcionar bem em:

- desktops;
- notebooks;
- tablets;
- celulares.

A navegação mobile possui painel próprio e fechamento automático ao selecionar uma seção.

---

## 👨‍💻 Autor

Desenvolvido por **Wess**.

GitHub: [@WessYu](https://github.com/WessYu)

---

## 📄 Licença

Este projeto foi desenvolvido para fins institucionais e de portfólio. Caso seja utilizado comercialmente, revise conteúdos, imagens, dados jurídicos e permissões de uso antes da publicação final.
