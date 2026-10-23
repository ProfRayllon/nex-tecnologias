const express = require("express");
const db = require("./db");
const auth = require("./auth");
const arquivos = require("./arquivos");
const { gerarHash, conferir } = require("./senha");
const { ErroDeUso, texto, assincrono, emailValido } = require("./util");

const { pool, uid, usuarioPublico, clienteDoBanco, projetoDoBanco } = db;
const rotas = express.Router();

rotas.get("/saude", assincrono(async (req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true });
}));

// ---------- Formulário de contato do site ----------
rotas.post("/contato", assincrono(async (req, res) => {
  const b = req.body || {};
  if (b.site) return res.json({ ok: true }); // campo invisível: só robô preenche
  if (auth.envioContato.bloqueado(req.ip)) throw new ErroDeUso("Recebemos várias mensagens daqui. Tente de novo mais tarde ou fale pelo WhatsApp.", 429);
  const nome = texto(b.nome, 160);
  const email = texto(b.email, 200).toLowerCase();
  if (!nome || !emailValido(email)) throw new ErroDeUso("Informe nome e um e-mail válido.");
  auth.envioContato.contar(req.ip);
  await pool.query(
    `INSERT INTO contatos (id, nome, email, telefone, instituicao, cidade, segmento, interesse, mensagem)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [uid("m"), nome, email, texto(b.telefone, 40), texto(b.instituicao, 200), texto(b.cidade, 120), texto(b.tipo, 60), texto(b.interesse, 120), texto(b.mensagem, 5000)],
  );
  res.json({ ok: true });
}));

// ---------- Sessão ----------
rotas.post("/entrar", assincrono(async (req, res) => {
  const ip = req.ip;
  if (auth.falhasLogin.bloqueado(ip)) throw new ErroDeUso("Muitas tentativas. Aguarde alguns minutos e tente novamente.", 429);
  const email = texto(req.body.email, 200).toLowerCase();
  const { rows } = await pool.query(
    `SELECT u.* FROM usuarios u LEFT JOIN clientes c ON c.id = u.cliente_id
     WHERE u.email = $1 AND u.ativo AND (u.perfil = 'admin' OR c.ativo)`,
    [email],
  );
  const usuario = rows[0];
  if (!usuario || !(await conferir(req.body.senha || "", usuario.senha_hash))) {
    auth.falhasLogin.contar(ip);
    throw new ErroDeUso("E-mail ou senha inválidos.", 401);
  }
  auth.falhasLogin.limpar(ip);
  await auth.criarSessao(res, usuario.id);
  const eu = usuarioPublico(usuario);
  if (eu.perfil === "cliente") await db.registrar(eu, "entrou");
  res.json({ usuario: eu });
}));

rotas.post("/sair", assincrono(async (req, res) => {
  await auth.encerrarSessao(req, res);
  res.json({ ok: true });
}));

rotas.get("/eu", auth.exigir(), (req, res) => res.json({ usuario: req.usuario }));

rotas.post("/minha-senha", auth.exigir(), assincrono(async (req, res) => {
  const senha = String(req.body.senha || "");
  if (senha.length < 8) throw new ErroDeUso("Use pelo menos 8 caracteres.");
  await pool.query("UPDATE usuarios SET senha_hash = $1, trocar_senha = FALSE WHERE id = $2", [await gerarHash(senha), req.usuario.id]);
  res.json({ ok: true });
}));

// ---------- Portal do cliente ----------
// Cliente: só os projetos visíveis do próprio cadastro.
// Admin: pré-visualização; ?cliente=ID mostra o portal daquele cliente (inclusive projetos ocultos).
rotas.get("/portal", auth.exigir(), assincrono(async (req, res) => {
  const eu = req.usuario;
  const admin = eu.perfil === "admin";
  const clienteId = admin ? texto(req.query.cliente, 60) || null : eu.clienteId;

  const filtros = [];
  const valores = [];
  if (clienteId) filtros.push(`p.cliente_id = $${valores.push(clienteId)}`);
  if (!admin) filtros.push("p.visivel");
  const onde = filtros.length ? `WHERE ${filtros.join(" AND ")}` : "";

  const [projetos, clientes] = await Promise.all([
    pool.query(`SELECT p.* FROM projetos p ${onde} ORDER BY p.criado_em DESC`, valores),
    pool.query(admin ? "SELECT * FROM clientes ORDER BY nome" : "SELECT * FROM clientes WHERE id = $1", admin ? [] : [eu.clienteId]),
  ]);
  const ids = projetos.rows.map((p) => p.id);
  const { rows: arqs } = await pool.query("SELECT * FROM arquivos WHERE projeto_id = ANY($1) ORDER BY ordem, criado_em", [ids]);

  const todos = clientes.rows.map(clienteDoBanco).map(({ id, nome, razaoSocial }) => ({ id, nome, razaoSocial }));
  res.json({
    eu,
    cliente: todos.find((c) => c.id === clienteId) || null,
    clientes: admin ? todos : [],
    projetos: projetos.rows.map((p) => {
      const { clienteId: cid, ...resto } = projetoDoBanco(p, arqs);
      return { ...resto, clienteId: cid, clienteNome: todos.find((c) => c.id === cid)?.nome || "" };
    }),
  });
}));

const ROTULO_DOWNLOAD = {
  orcamento: "baixou o orçamento",
  codigo: "baixou o código-fonte",
  documento: "baixou um documento",
  video: "baixou o vídeo",
};

rotas.get("/arquivos/:id", auth.exigir(), assincrono(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT a.*, p.cliente_id, p.visivel, p.nome AS projeto_nome FROM arquivos a
     JOIN projetos p ON p.id = a.projeto_id WHERE a.id = $1`,
    [req.params.id],
  );
  const arquivo = rows[0];
  const eu = req.usuario;
  const pode = arquivo && (eu.perfil === "admin" || (arquivo.cliente_id === eu.clienteId && arquivo.visivel));
  if (!pode) return res.status(404).send("Arquivo não encontrado.");
  const baixar = req.query.baixar === "1";
  if (eu.perfil === "cliente" && baixar && ROTULO_DOWNLOAD[arquivo.tipo]) {
    await db.registrar(eu, ROTULO_DOWNLOAD[arquivo.tipo], `${arquivo.projeto_nome} · ${arquivo.titulo || arquivo.nome_original}`);
  }
  arquivos.enviar(res, arquivo, baixar);
}));

module.exports = rotas;
