const path = require("node:path");

const env = process.env;
// Pasta do site (index.html, assets/). No Docker, o projeto é copiado para /app.
const RAIZ = path.resolve(env.APP_ROOT || path.join(__dirname, "../.."));

// Não iniciar com credenciais públicas ou uma conexão implícita.
if (!env.DATABASE_URL || !env.DATABASE_URL.trim()) {
  throw new Error("Defina DATABASE_URL no ambiente antes de iniciar a aplicação.");
}

module.exports = {
  PORTA: Number(env.PORT || 3000),
  RAIZ,
  // Arquivos enviados (orçamentos, telas, código). No Docker é um volume.
  UPLOADS: path.resolve(env.UPLOADS_DIR || path.join(RAIZ, "uploads")),
  MAX_UPLOAD_MB: Number(env.MAX_UPLOAD_MB || 500),
  DATABASE_URL: env.DATABASE_URL,
  PRODUCAO: env.NODE_ENV === "production",
  HORAS_SESSAO: Number(env.SESSION_HOURS || 12),
  // Primeiro acesso: criado só quando o banco ainda não tem nenhum administrador.
  ADMIN_EMAIL: (env.ADMIN_EMAIL || "contato@nextecnologias.com.br").trim().toLowerCase(),
  ADMIN_SENHA: env.ADMIN_PASSWORD || "",
};
