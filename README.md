# NEX Tecnologias

Site institucional da NEX Tecnologias, **área do cliente** e **painel administrativo**.

🌐 https://nextecnologias.com.br

| Endereço   | O que é                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------- |
| `/`        | Site institucional (o formulário de contato grava no banco)                               |
| `/entrar`  | Login de clientes e da equipe NEX (no 1º acesso pede para criar uma senha pessoal)        |
| `/portal`  | Área do cliente: orçamento (PDF), telas, vídeo, informações, tecnologias, link de acesso e download do código-fonte |
| `/admin`   | Painel da NEX: clientes, projetos, arquivos, acessos, contatos do site e atividade        |

Os sistemas dos clientes (ex.: Jornada SAVA, Apresentação PrimeEdu) **não rodam aqui**: cada um tem domínio, banco e
repositório próprios. O banco da NEX guarda só o cadastro do cliente, o projeto e as entregas.

## Estrutura

```text
index.html  entrar.html  portal.html  admin.html  404.html
assets/
  css/   style.css (site) · app.css (login, portal e painel)
  js/    main.js (site) · nex.js (utilidades) · entrar.js · portal.js · admin.js
server/  API Node.js + PostgreSQL
  src/   index.js · rotas.js (público, login, portal) · admin.js (painel) · arquivos.js · auth.js · db.js
  sql/   migrações, aplicadas sozinhas na ordem (002 cadastra a Jornada SAVA, 005 a PrimeEdu)
deploy/  backup.sh · enviar-entrega.mjs · sites/ (outros domínios no mesmo Caddy) · sava/ (SAVA na mesma VPS)
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
3. No projeto, envie o **orçamento (PDF)**, as **telas** e o **código-fonte (ZIP)**. Quando houver, envie também o
   **vídeo** (MP4), que vira uma aba no portal.
4. **Acessos → Novo acesso**: gera a senha provisória e uma mensagem pronta para mandar por WhatsApp ou e-mail.
5. Use **Ver como o cliente** para conferir o portal antes de enviar.

Com uma pasta de entrega pronta (com `entrega.json`, como `entregas/prime-edu`), os arquivos podem ser enviados de uma vez,
com título e legenda. O script pula o que já foi enviado:

```bash
NEX_URL=https://nextecnologias.com.br ADMIN_EMAIL=... ADMIN_PASSWORD=... node deploy/enviar-entrega.mjs entregas/prime-edu
```

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
# Configure DATABASE_URL em ../.env com a conexão local antes de iniciar.
npm run dev
```

Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no ambiente para criar o primeiro administrador.
Não existe senha padrão. Em um banco que já possui administrador, essas variáveis não alteram a senha da conta.


## Segurança e configuração

O `.env.example` contém somente exemplos. Copie-o para `.env` e preencha os valores em um editor local, sem incluir segredos em comandos, logs ou commits. Use senhas diferentes para o banco, o portal, a caixa de e-mail e a VPS. Arquivos `.env*` (exceto `.env.example`) ficam fora do Git e do contexto de build Docker.

O Docker Compose já transmite `DATABASE_URL` e `ADMIN_PASSWORD` para a aplicação. Fora do Docker, configure `DATABASE_URL` explicitamente; `npm run dev` carrega o `.env` da raiz. A senha dentro de `DATABASE_URL` precisa estar codificada para URL quando contiver caracteres reservados. O Compose atual interpola `POSTGRES_PASSWORD` diretamente, sem codificação automática; para uma instalação nova, prefira uma senha aleatória com caracteres seguros para URL (por exemplo, gerada com `openssl rand -hex 32`).

O formulário de contato grava no PostgreSQL; este projeto não contém cliente SMTP nem envio de e-mail. `ADMIN_EMAIL` identifica a conta do portal e `ACME_EMAIL` é o contato dos certificados HTTPS; nenhum deles configura a autenticação de uma caixa de e-mail.

Antes de aplicar esta versão na VPS, confirme a configuração existente sem imprimir valores. Alterar `ADMIN_PASSWORD` não troca a senha de um usuário já criado. Alterar `POSTGRES_PASSWORD` no `.env` não troca a senha de um PostgreSQL com volume inicializado; qualquer rotação precisa ser coordenada com o banco e a aplicação. Veja [a auditoria de segurança](SECURITY-AUDIT.md).
