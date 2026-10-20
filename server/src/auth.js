const crypto = require("node:crypto");
const config = require("./config");
const { pool, usuarioPublico } = require("./db");

const COOKIE = "nex_sessao";
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

function lerCookie(req) {
  const linha = req.headers.cookie || "";
  const par = linha.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${COOKIE}=`));
  return par ? decodeURIComponent(par.slice(COOKIE.length + 1)) : null;
}

const opcoesCookie = () => ({ httpOnly: true, sameSite: "lax", secure: config.PRODUCAO, path: "/" });

async function criarSessao(res, usuarioId) {
  const token = crypto.randomBytes(32).toString("base64url");
  const expira = new Date(Date.now() + config.HORAS_SESSAO * 3600 * 1000);
  await pool.query("INSERT INTO sessoes (token_hash, usuario_id, expira_em) VALUES ($1, $2, $3)", [hashToken(token), usuarioId, expira]);
  await pool.query("UPDATE usuarios SET ultimo_acesso = now() WHERE id = $1", [usuarioId]);
  res.cookie(COOKIE, token, { ...opcoesCookie(), expires: expira });
}

async function encerrarSessao(req, res) {
  const token = lerCookie(req);
  if (token) await pool.query("DELETE FROM sessoes WHERE token_hash = $1", [hashToken(token)]);
  res.clearCookie(COOKIE, opcoesCookie());
}

// Usuário de cliente só entra se o cliente também estiver ativo.
async function usuarioDaSessao(req) {
  const token = lerCookie(req);
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT u.* FROM sessoes s
     JOIN usuarios u ON u.id = s.usuario_id
     LEFT JOIN clientes c ON c.id = u.cliente_id
     WHERE s.token_hash = $1 AND s.expira_em > now() AND u.ativo AND (u.perfil = 'admin' OR c.ativo)`,
    [hashToken(token)],
  );
  return rows[0] ? usuarioPublico(rows[0]) : null;
}

// Middleware: exige sessão e, opcionalmente, um dos perfis informados.
function exigir(...perfis) {
  return async (req, res, next) => {
    try {
      req.usuario = await usuarioDaSessao(req);
      if (!req.usuario) return res.status(401).json({ erro: "Sessão expirada. Entre novamente." });
      if (perfis.length && !perfis.includes(req.usuario.perfil)) return res.status(403).json({ erro: "Seu perfil não tem permissão para esta ação." });
      next();
    } catch (err) {
      next(err);
    }
  };
}

// Limite simples de tentativas por IP (memória do processo), usado no login e no formulário de contato.
function limitador(maximo, janelaMs) {
  const mapa = new Map();
  return {
    bloqueado(ip) {
      const t = mapa.get(ip);
      return Boolean(t && t.ate > Date.now() && t.n >= maximo);
    },
    contar(ip) {
      const t = mapa.get(ip);
      if (!t || t.ate < Date.now()) mapa.set(ip, { n: 1, ate: Date.now() + janelaMs });
      else t.n += 1;
    },
    limpar(ip) {
      mapa.delete(ip);
    },
    varrer() {
      for (const [ip, t] of mapa) if (t.ate < Date.now()) mapa.delete(ip);
    },
  };
}

const falhasLogin = limitador(10, 15 * 60 * 1000);
const envioContato = limitador(5, 60 * 60 * 1000);

async function limparSessoesVencidas() {
  await pool.query("DELETE FROM sessoes WHERE expira_em < now()");
  falhasLogin.varrer();
  envioContato.varrer();
}

module.exports = {
  criarSessao,
  encerrarSessao,
  usuarioDaSessao,
  exigir,
  falhasLogin,
  envioContato,
  limparSessoesVencidas,
};
