const path = require("node:path");
const express = require("express");
const db = require("./db");
const auth = require("./auth");
const arquivos = require("./arquivos");
const { gerarHash, senhaProvisoria } = require("./senha");
const { ErroDeUso, texto, assincrono, emailValido, url, data } = require("./util");

const { pool, uid, transacao, usuarioPublico, clienteDoBanco, projetoDoBanco, contatoDoBanco } = db;
const admin = express.Router();
admin.use(auth.exigir("admin"));

const STATUS = ["proposta", "aprovado", "desenvolvimento", "homologacao", "entregue"];

// Tudo o que o painel mostra numa leitura só (a base de uma consultoria é pequena).
admin.get("/estado", assincrono(async (req, res) => {
  const [clientes, projetos, arqs, usuarios, contatos, registros] = await Promise.all([
    pool.query("SELECT * FROM clientes ORDER BY nome"),
    pool.query("SELECT * FROM projetos ORDER BY criado_em DESC"),
    pool.query("SELECT * FROM arquivos ORDER BY ordem, criado_em"),
    pool.query("SELECT * FROM usuarios ORDER BY perfil, nome"),
    pool.query("SELECT * FROM contatos ORDER BY criado_em DESC"),
    pool.query(
      `SELECT r.*, u.nome AS usuario_nome, c.nome AS cliente_nome FROM registros r
       LEFT JOIN usuarios u ON u.id = r.usuario_id LEFT JOIN clientes c ON c.id = r.cliente_id
       ORDER BY r.criado_em DESC LIMIT 200`,
    ),
  ]);
  res.json({
    eu: req.usuario,
    clientes: clientes.rows.map(clienteDoBanco),
    projetos: projetos.rows.map((p) => projetoDoBanco(p, arqs.rows)),
    usuarios: usuarios.rows.map(usuarioPublico),
    contatos: contatos.rows.map(contatoDoBanco),
    registros: registros.rows.map((r) => ({
      id: r.id,
      acao: r.acao,
      detalhe: r.detalhe,
      usuarioNome: r.usuario_nome,
      clienteId: r.cliente_id,
      clienteNome: r.cliente_nome,
      criadoEm: r.criado_em,
    })),
  });
}));

// ---------- Clientes ----------
function dadosCliente(b) {
  const c = {
    nome: texto(b.nome, 160),
    razaoSocial: texto(b.razaoSocial, 200),
    documento: texto(b.documento, 30),
    contatoNome: texto(b.contatoNome, 160),
    email: texto(b.email, 200).toLowerCase(),
    telefone: texto(b.telefone, 40),
    cidade: texto(b.cidade, 120),
    observacoes: texto(b.observacoes, 5000),
    ativo: b.ativo !== false,
  };
  if (!c.nome) throw new ErroDeUso("Informe o nome do cliente.");
  if (c.email && !emailValido(c.email)) throw new ErroDeUso("E-mail do cliente inválido.");
  return c;
}

admin.post("/clientes", assincrono(async (req, res) => {
  const c = dadosCliente(req.body);
  const id = uid("c");
  await pool.query(
    `INSERT INTO clientes (id, nome, razao_social, documento, contato_nome, email, telefone, cidade, observacoes, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [id, c.nome, c.razaoSocial, c.documento, c.contatoNome, c.email, c.telefone, c.cidade, c.observacoes, c.ativo],
  );
  res.json({ id });
}));

admin.put("/clientes/:id", assincrono(async (req, res) => {
  const c = dadosCliente(req.body);
  const { rowCount } = await pool.query(
    `UPDATE clientes SET nome = $2, razao_social = $3, documento = $4, contato_nome = $5, email = $6,
     telefone = $7, cidade = $8, observacoes = $9, ativo = $10 WHERE id = $1`,
    [req.params.id, c.nome, c.razaoSocial, c.documento, c.contatoNome, c.email, c.telefone, c.cidade, c.observacoes, c.ativo],
  );
  if (!rowCount) throw new ErroDeUso("Cliente não encontrado.", 404);
  res.json({ ok: true });
}));

admin.delete("/clientes/:id", assincrono(async (req, res) => {
  const { rows } = await pool.query(
    "SELECT a.caminho FROM arquivos a JOIN projetos p ON p.id = a.projeto_id WHERE p.cliente_id = $1",
    [req.params.id],
  );
  await pool.query("DELETE FROM clientes WHERE id = $1", [req.params.id]);
  await Promise.all(rows.map((r) => arquivos.remover(r.caminho)));
  res.json({ ok: true });
}));

// ---------- Projetos ----------
const lista = (v) => (Array.isArray(v) ? v : []);

function dadosProjeto(b) {
  const p = {
    clienteId: texto(b.clienteId, 60),
    nome: texto(b.nome, 160),
    subtitulo: texto(b.subtitulo, 300),
    descricao: texto(b.descricao, 20000),
    status: STATUS.includes(b.status) ? b.status : "proposta",
    urlAcesso: url(b.urlAcesso),
    urlCodigo: url(b.urlCodigo),
    destaques: lista(b.destaques).map((d) => texto(d, 300)).filter(Boolean).slice(0, 60),
    informacoes: lista(b.informacoes)
      .map((i) => ({ rotulo: texto(i?.rotulo, 80), valor: texto(i?.valor, 400) }))
      .filter((i) => i.rotulo && i.valor)
      .slice(0, 60),
    tecnologias: lista(b.tecnologias)
      .map((t) => ({ categoria: texto(t?.categoria, 60) || "Outros", nome: texto(t?.nome, 80) }))
      .filter((t) => t.nome)
      .slice(0, 120),
    inicio: data(b.inicio),
    entrega: data(b.entrega),
    visivel: b.visivel !== false,
  };
  if (!p.clienteId) throw new ErroDeUso("Escolha o cliente do projeto.");
  if (!p.nome) throw new ErroDeUso("Informe o nome do projeto.");
  return p;
}

const valoresProjeto = (p) => [
  p.clienteId, p.nome, p.subtitulo, p.descricao, p.status, p.urlAcesso, p.urlCodigo,
  JSON.stringify(p.destaques), JSON.stringify(p.informacoes), JSON.stringify(p.tecnologias),
  p.inicio, p.entrega, p.visivel,
];

admin.post("/projetos", assincrono(async (req, res) => {
  const id = uid("p");
  await pool.query(
    `INSERT INTO projetos (id, cliente_id, nome, subtitulo, descricao, status, url_acesso, url_codigo,
     destaques, informacoes, tecnologias, inicio, entrega, visivel)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [id, ...valoresProjeto(dadosProjeto(req.body))],
  );
  res.json({ id });
}));

admin.put("/projetos/:id", assincrono(async (req, res) => {
  const { rowCount } = await pool.query(
    `UPDATE projetos SET cliente_id = $2, nome = $3, subtitulo = $4, descricao = $5, status = $6, url_acesso = $7,
     url_codigo = $8, destaques = $9, informacoes = $10, tecnologias = $11, inicio = $12, entrega = $13, visivel = $14,
     atualizado_em = now() WHERE id = $1`,
    [req.params.id, ...valoresProjeto(dadosProjeto(req.body))],
  );
  if (!rowCount) throw new ErroDeUso("Projeto não encontrado.", 404);
  res.json({ ok: true });
}));

admin.delete("/projetos/:id", assincrono(async (req, res) => {
  const { rows } = await pool.query("SELECT caminho FROM arquivos WHERE projeto_id = $1", [req.params.id]);
  await pool.query("DELETE FROM projetos WHERE id = $1", [req.params.id]);
  await Promise.all(rows.map((r) => arquivos.remover(r.caminho)));
  res.json({ ok: true });
}));

// ---------- Arquivos do projeto ----------
// O corpo do pedido é o próprio arquivo (application/octet-stream); tipo, nome e título vêm na URL.
admin.post("/projetos/:id/arquivos", assincrono(async (req, res) => {
  const tipo = texto(req.query.tipo, 20);
  const nome = path.basename(texto(req.query.nome, 200)) || "arquivo";
  const { ext, mime } = arquivos.validar(tipo, nome);
  const { rows } = await pool.query("SELECT id FROM projetos WHERE id = $1", [req.params.id]);
  if (!rows[0]) throw new ErroDeUso("Projeto não encontrado.", 404);

  const id = uid("a");
  const caminho = `${req.params.id}/${id}${ext}`;
  const tamanho = await arquivos.gravar(req, caminho);
  const titulo = texto(req.query.titulo, 200) || path.basename(nome, path.extname(nome));
  try {
    await pool.query(
      `INSERT INTO arquivos (id, projeto_id, tipo, titulo, nome_original, mime, tamanho, caminho, ordem)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8,
         (SELECT COALESCE(MAX(ordem), 0) + 1 FROM arquivos WHERE projeto_id = $2 AND tipo = $3))`,
      [id, req.params.id, tipo, titulo, nome, mime, tamanho, caminho],
    );
    await pool.query("UPDATE projetos SET atualizado_em = now() WHERE id = $1", [req.params.id]);
  } catch (err) {
    await arquivos.remover(caminho);
    throw err;
  }
  res.json({ id });
}));

admin.put("/arquivos/:id", assincrono(async (req, res) => {
  const { rowCount } = await pool.query("UPDATE arquivos SET titulo = $2, legenda = $3 WHERE id = $1", [
    req.params.id,
    texto(req.body.titulo, 200),
    texto(req.body.legenda, 500),
  ]);
  if (!rowCount) throw new ErroDeUso("Arquivo não encontrado.", 404);
  res.json({ ok: true });
}));

// Recebe a lista de ids na nova ordem (galeria de telas, por exemplo).
admin.put("/projetos/:id/ordem", assincrono(async (req, res) => {
  const ids = lista(req.body.ids).map((i) => texto(i, 60));
  await transacao(async (c) => {
    for (const [i, id] of ids.entries()) {
      await c.query("UPDATE arquivos SET ordem = $3 WHERE id = $1 AND projeto_id = $2", [id, req.params.id, i + 1]);
    }
  });
  res.json({ ok: true });
}));

admin.delete("/arquivos/:id", assincrono(async (req, res) => {
  const { rows } = await pool.query("DELETE FROM arquivos WHERE id = $1 RETURNING caminho", [req.params.id]);
  if (rows[0]) await arquivos.remover(rows[0].caminho);
  res.json({ ok: true });
}));

// ---------- Acessos (usuários) ----------
// Sem senha informada, gera uma provisória e devolve uma única vez para a NEX repassar ao cliente.
admin.post("/usuarios", assincrono(async (req, res) => {
  const b = req.body;
  const nome = texto(b.nome, 160);
  const email = texto(b.email, 200).toLowerCase();
  const perfil = b.perfil === "admin" ? "admin" : "cliente";
  const clienteId = perfil === "cliente" ? texto(b.clienteId, 60) : null;
  if (!nome || !emailValido(email)) throw new ErroDeUso("Informe nome e um e-mail válido.");
  if (perfil === "cliente" && !clienteId) throw new ErroDeUso("Escolha o cliente deste acesso.");
  const senha = String(b.senha || "") || senhaProvisoria();
  if (senha.length < 8) throw new ErroDeUso("A senha precisa de pelo menos 8 caracteres.");
  const id = uid("u");
  try {
    await pool.query(
      "INSERT INTO usuarios (id, nome, email, perfil, cliente_id, senha_hash, trocar_senha) VALUES ($1, $2, $3, $4, $5, $6, TRUE)",
      [id, nome, email, perfil, clienteId, await gerarHash(senha)],
    );
  } catch (err) {
    if (err.code === "23505") throw new ErroDeUso("Já existe um acesso com este e-mail.");
    throw err;
  }
  res.json({ id, senha });
}));

admin.put("/usuarios/:id", assincrono(async (req, res) => {
  const b = req.body;
  const nome = texto(b.nome, 160);
  const email = texto(b.email, 200).toLowerCase();
  if (!nome || !emailValido(email)) throw new ErroDeUso("Informe nome e um e-mail válido.");
  const ativo = b.ativo !== false;
  if (!ativo && req.params.id === req.usuario.id) throw new ErroDeUso("Você não pode desativar o próprio acesso.");
  try {
    const { rowCount } = await pool.query("UPDATE usuarios SET nome = $2, email = $3, ativo = $4 WHERE id = $1", [req.params.id, nome, email, ativo]);
    if (!rowCount) throw new ErroDeUso("Acesso não encontrado.", 404);
  } catch (err) {
    if (err.code === "23505") throw new ErroDeUso("Já existe um acesso com este e-mail.");
    throw err;
  }
  if (!ativo) await pool.query("DELETE FROM sessoes WHERE usuario_id = $1", [req.params.id]);
  res.json({ ok: true });
}));

admin.post("/usuarios/:id/nova-senha", assincrono(async (req, res) => {
  const senha = senhaProvisoria();
  const { rowCount } = await pool.query("UPDATE usuarios SET senha_hash = $2, trocar_senha = TRUE WHERE id = $1", [req.params.id, await gerarHash(senha)]);
  if (!rowCount) throw new ErroDeUso("Acesso não encontrado.", 404);
  await pool.query("DELETE FROM sessoes WHERE usuario_id = $1", [req.params.id]);
  res.json({ senha });
}));

admin.delete("/usuarios/:id", assincrono(async (req, res) => {
  if (req.params.id === req.usuario.id) throw new ErroDeUso("Você não pode excluir o próprio acesso.");
  await pool.query("DELETE FROM usuarios WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

// ---------- Contatos do site ----------
admin.put("/contatos/:id", assincrono(async (req, res) => {
  await pool.query("UPDATE contatos SET lido = $2 WHERE id = $1", [req.params.id, req.body.lido !== false]);
  res.json({ ok: true });
}));

admin.delete("/contatos/:id", assincrono(async (req, res) => {
  await pool.query("DELETE FROM contatos WHERE id = $1", [req.params.id]);
  res.json({ ok: true });
}));

module.exports = admin;
