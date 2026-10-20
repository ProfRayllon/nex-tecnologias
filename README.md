# NEX Tecnologias

Site institucional da NEX Tecnologias, **área do cliente** e **painel administrativo**.

🌐 https://nextecnologias.com.br

| Endereço   | O que é                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| `/`        | Site institucional (o formulário de contato grava no banco)                               |
| `/entrar`  | Login de clientes e da equipe NEX (no 1º acesso pede para criar uma senha pessoal)        |
| `/portal`  | Área do cliente: orçamento (PDF), telas do sistema, informações, tecnologias, link de acesso e download do código-fonte |
| `/admin`   | Painel da NEX: clientes, projetos, arquivos, acessos, contatos do site e atividade        |

Os sistemas dos clientes (ex.: Jornada SAVA) **não rodam aqui**: cada um tem domínio, banco e
repositório próprios. O banco da NEX guarda só o cadastro do cliente, o projeto e as entregas.

## Estrutura

```text
index.html  entrar.html  portal.html  admin.html  404.html
assets/
  css/   style.css (site) · app.css (login, portal e painel)
  js/    main.js (site) · nex.js (utilidades) · entrar.js · portal.js · admin.js
server/  API Node.js + PostgreSQL
  src/   index.js · rotas.js (público, login, portal) · admin.js (painel) · arquivos.js · auth.js · db.js
  sql/   migrações, aplicadas sozinhas na ordem (002 cadastra o cliente Jornada SAVA)
deploy/  backup.sh · sites/ (outros domínios no mesmo Caddy) · sava/ (SAVA na mesma VPS)
```

## Como os dados ficam

- **PostgreSQL**: clientes, acessos, projetos, arquivos (metadados), contatos do site e registro de atividade.
- **Volume `uploads`**: os arquivos enviados pelo painel. Só saem pela API, conferindo a sessão:
  o cliente só baixa arquivos dos próprios projetos visíveis.
- Senhas com scrypt, sessão em cookie `httpOnly`, limite de tentativas de login, HTTPS pelo Caddy.
- Downloads de orçamento e código feitos pelo cliente ficam registrados em **Atividade**.

## Fluxo para um cliente novo

1. **Clientes → Novo cliente**.
2. **Projetos → Novo projeto**: descrição, funcionalidades, informações, tecnologias, link do sistema.
3. No projeto, envie o **orçamento (PDF)**, as **telas** e o **código-fonte (ZIP)**.
4. **Acessos → Novo acesso**: gera a senha provisória e uma mensagem pronta para mandar por WhatsApp ou e-mail.
5. Use **Ver como o cliente** para conferir o portal antes de enviar.

O pacote do código pode ser gerado a partir do repositório do sistema:

```bash
git archive --format=zip --prefix=nome-do-sistema/ -o codigo-fonte.zip HEAD
```

## Publicando na VPS

Ubuntu 22.04/24.04 com 1 GB de RAM já basta.

1. **DNS**: registro `A` de `nextecnologias.com.br` (e `www`) apontando para o IP da VPS.
   Se o site ainda estiver no GitHub Pages, desative o Pages depois que o DNS mudar.
2. **Docker**: `curl -fsSL https://get.docker.com | sh`
3. **Código**:

   ```bash
   git clone <repositório da NEX> /opt/nex
   cd /opt/nex
   cp .env.example .env
   nano .env   # DOMAIN, POSTGRES_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD (openssl rand -base64 24)
   ```

4. **Subir**:

   ```bash
   docker compose up -d --build
   docker compose logs -f app   # "Administrador criado" e "rodando"
   ```

   Acesse `https://nextecnologias.com.br/entrar` com o `ADMIN_EMAIL`/`ADMIN_PASSWORD` do `.env`.

5. **Firewall**: `ufw allow OpenSSH && ufw allow 80 && ufw allow 443 && ufw enable`
6. **Backup diário** (banco + arquivos, guarda 14 dias):

   ```bash
   crontab -e
   0 3 * * * cd /opt/nex && sh deploy/backup.sh >> backups/backup.log 2>&1
   ```

   Restaurar o banco: `gunzip -c backups/nex-banco-DATA.sql.gz | docker compose exec -T db psql -U nex nex`

### Jornada SAVA na mesma VPS

O Caddy da NEX é o único que usa as portas 80/443 e atende os dois domínios. O SAVA continua com
banco e código separados; nada muda no repositório dele.

1. Suba a NEX primeiro (cria a rede `web`).
2. Na pasta do SAVA (`/opt/jornada-sava`), copie `deploy/sava/docker-compose.override.yml` da NEX
   e rode `docker compose up -d --build` (o Caddy do SAVA fica desligado).
3. Na NEX: `mv deploy/sites/jornadasava.caddy.exemplo deploy/sites/jornadasava.caddy && docker compose restart caddy`.

Se o SAVA estiver em outra VPS, nada disso é preciso: ele segue com o próprio Caddy.

### Atualizando

```bash
cd /opt/nex && git pull && docker compose up -d --build
```

## Rodando localmente

Precisa do Node.js 20+ e de um PostgreSQL (ou `docker compose up db`).

```powershell
cd server
npm install
$env:DATABASE_URL = ""
npm start
```

Acesse `http://localhost:3000`. Sem `ADMIN_PASSWORD`, o administrador inicial é
`contato@nextecnologias.com.br` / `` (pede a troca no primeiro acesso).
