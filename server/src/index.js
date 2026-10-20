const path = require("node:path");
const express = require("express");
const config = require("./config");
const db = require("./db");
const auth = require("./auth");
const rotas = require("./rotas");
const admin = require("./admin");

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", "loopback, uniquelocal"); // atrás do Caddy

app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
  });
  next();
});

// Pedidos que alteram dados só valem vindos do próprio site.
app.use("/api", (req, res, next) => {
  if (req.method === "GET") return next();
  const origem = req.get("origin");
  if (origem && new URL(origem).host !== req.get("host")) return res.status(403).json({ erro: "Origem não permitida." });
  next();
});
// O envio de arquivos chega como octet-stream e é tratado em admin.js, fora do express.json.
app.use("/api", express.json({ limit: "1mb" }));
app.use("/api/admin", admin);
app.use("/api", rotas);
app.use("/api", (req, res) => res.status(404).json({ erro: "Rota não encontrada." }));

// ---------- Site ----------
const raiz = (arquivo) => path.join(config.RAIZ, arquivo);
const enviar = (arquivo) => (req, res) => res.sendFile(raiz(arquivo));

// Portal e painel só abrem com sessão ativa (o painel, só para a equipe NEX).
const comSessao = (arquivo, perfil) => async (req, res, next) => {
  try {
    const usuario = await auth.usuarioDaSessao(req);
    if (!usuario) return res.redirect(`/entrar?volta=${encodeURIComponent(req.originalUrl)}`);
    if (perfil && usuario.perfil !== perfil) return res.redirect("/portal");
    res.set("Cache-Control", "no-store");
    res.sendFile(raiz(arquivo));
  } catch (err) {
    next(err);
  }
};

app.get(["/", "/index.html"], enviar("index.html"));
app.get(["/entrar", "/login", "/cliente"], enviar("entrar.html"));
app.get("/portal", comSessao("portal.html"));
app.get("/admin", comSessao("admin.html", "admin"));
app.get("/favicon.ico", enviar("assets/img/favicon.png"));
app.use("/assets", express.static(raiz("assets"), { maxAge: "1h", fallthrough: false }));

app.use((req, res) => res.status(404).sendFile(raiz("404.html")));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.status && err.status < 500) {
    if (req.path.startsWith("/api")) return res.status(err.status).json({ erro: err.message });
    return res.sendStatus(err.status);
  }
  console.error(err);
  if (req.path.startsWith("/api")) return res.status(500).json({ erro: "Erro interno do servidor." });
  res.status(500).send("Erro interno do servidor.");
});

async function iniciar() {
  await db.migrar();
  await db.semear();
  setInterval(() => auth.limparSessoesVencidas().catch(console.error), 60 * 60 * 1000);
  app.listen(config.PORTA, () => console.log(`NEX Tecnologias rodando em http://localhost:${config.PORTA}`));
}

iniciar().catch((err) => {
  console.error("Falha ao iniciar:", err);
  process.exit(1);
});
