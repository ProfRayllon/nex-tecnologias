const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Pool } = require("pg");
const config = require("./config");
const { gerarHash } = require("./senha");

const pool = new Pool({ connectionString: config.DATABASE_URL });

const uid = (prefixo) => `${prefixo}_${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;

async function transacao(fn) {
  const cliente = await pool.connect();
  try {
    await cliente.query("BEGIN");
    const resultado = await fn(cliente);
    await cliente.query("COMMIT");
    return resultado;
  } catch (err) {
    await cliente.query("ROLLBACK");
    throw err;
  } finally {
    cliente.release();
  }
}

// Aplica, em ordem, os arquivos de server/sql que ainda não rodaram neste banco.
async function migrar() {
  await pool.query("CREATE TABLE IF NOT EXISTS migracoes (nome TEXT PRIMARY KEY, aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now())");
  const pasta = path.join(__dirname, "../sql");
  const arquivos = fs.readdirSync(pasta).filter((f) => f.endsWith(".sql")).sort();
  const { rows } = await pool.query("SELECT nome FROM migracoes");
  const feitas = new Set(rows.map((r) => r.nome));
  for (const nome of arquivos.filter((f) => !feitas.has(f))) {
    await transacao(async (c) => {
      await c.query(fs.readFileSync(path.join(pasta, nome), "utf8"));
      await c.query("INSERT INTO migracoes (nome) VALUES ($1)", [nome]);
    });
    console.log(`Migração aplicada: ${nome}`);
  }
}

// Primeiro start: cria o administrador da NEX.
async function semear() {
  const { rows } = await pool.query("SELECT count(*)::int AS n FROM usuarios WHERE perfil = 'admin'");
  if (rows[0].n) return;
  if (!config.ADMIN_SENHA || !config.ADMIN_SENHA.trim()) {
    throw new Error("Defina ADMIN_PASSWORD no ambiente para criar o primeiro administrador.");
  }
  await pool.query(
    "INSERT INTO usuarios (id, nome, email, perfil, senha_hash, trocar_senha) VALUES ($1, 'NEX Tecnologias', $2, 'admin', $3, TRUE)",
    [uid("u"), config.ADMIN_EMAIL, await gerarHash(config.ADMIN_SENHA)],
  );
  console.log(`Administrador criado: ${config.ADMIN_EMAIL}`);
}

async function registrar(usuario, acao, detalhe = "") {
  await pool.query("INSERT INTO registros (usuario_id, cliente_id, acao, detalhe) VALUES ($1, $2, $3, $4)", [
    usuario?.id || null,
    usuario?.clienteId || null,
    acao,
    detalhe,
  ]);
}

// ---------- Conversão linha → objeto usado pelo front-end ----------
const usuarioPublico = (r) => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  perfil: r.perfil,
  clienteId: r.cliente_id,
  ativo: r.ativo,
  trocarSenha: r.trocar_senha,
  ultimoAcesso: r.ultimo_acesso,
  criadoEm: r.criado_em,
});

const clienteDoBanco = (r) => ({
  id: r.id,
  nome: r.nome,
  razaoSocial: r.razao_social,
  documento: r.documento,
  contatoNome: r.contato_nome,
  email: r.email,
  telefone: r.telefone,
  cidade: r.cidade,
  observacoes: r.observacoes,
  ativo: r.ativo,
  criadoEm: r.criado_em,
});

const arquivoDoBanco = (r) => ({
  id: r.id,
  projetoId: r.projeto_id,
  tipo: r.tipo,
  titulo: r.titulo,
  legenda: r.legenda,
  nome: r.nome_original,
  mime: r.mime,
  tamanho: Number(r.tamanho),
  ordem: r.ordem,
  criadoEm: r.criado_em,
});

const dataISO = (d) => (d ? new Date(d).toISOString().slice(0, 10) : null);

const projetoDoBanco = (r, arquivos = []) => ({
  id: r.id,
  clienteId: r.cliente_id,
  nome: r.nome,
  subtitulo: r.subtitulo,
  descricao: r.descricao,
  status: r.status,
  urlAcesso: r.url_acesso,
  urlCodigo: r.url_codigo,
  acessoUsuario: r.acesso_usuario,
  acessoSenha: r.acesso_senha,
  destaques: r.destaques,
  informacoes: r.informacoes,
  tecnologias: r.tecnologias,
  inicio: dataISO(r.inicio),
  entrega: dataISO(r.entrega),
  visivel: r.visivel,
  criadoEm: r.criado_em,
  atualizadoEm: r.atualizado_em,
  arquivos: arquivos.filter((a) => a.projeto_id === r.id).map(arquivoDoBanco),
});

const contatoDoBanco = (r) => ({
  id: r.id,
  nome: r.nome,
  email: r.email,
  telefone: r.telefone,
  instituicao: r.instituicao,
  cidade: r.cidade,
  segmento: r.segmento,
  interesse: r.interesse,
  mensagem: r.mensagem,
  lido: r.lido,
  criadoEm: r.criado_em,
});

module.exports = {
  pool,
  uid,
  transacao,
  migrar,
  semear,
  registrar,
  usuarioPublico,
  clienteDoBanco,
  arquivoDoBanco,
  projetoDoBanco,
  contatoDoBanco,
};
