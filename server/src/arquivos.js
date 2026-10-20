const fs = require("node:fs");
const path = require("node:path");
const { Transform } = require("node:stream");
const { pipeline } = require("node:stream/promises");
const config = require("./config");
const { ErroDeUso } = require("./util");

// Extensões aceitas e o tipo servido. SVG fica de fora: pode carregar script.
const MIMES = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".gz": "application/gzip",
  ".tgz": "application/gzip",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/plain; charset=utf-8",
};

const ACEITOS_POR_TIPO = {
  orcamento: [".pdf"],
  imagem: [".png", ".jpg", ".jpeg", ".webp", ".gif"],
  codigo: [".zip", ".rar", ".7z", ".gz", ".tgz"],
  documento: Object.keys(MIMES),
};

function validar(tipo, nome) {
  const aceitos = ACEITOS_POR_TIPO[tipo];
  if (!aceitos) throw new ErroDeUso("Tipo de arquivo inválido.");
  const ext = path.extname(nome).toLowerCase();
  if (!aceitos.includes(ext)) throw new ErroDeUso(`Para este campo envie: ${aceitos.join(", ")}.`);
  return { ext, mime: MIMES[ext] };
}

// Grava o corpo do pedido direto em disco, sem passar pela memória, respeitando o limite.
async function gravar(req, caminhoRelativo) {
  const limite = config.MAX_UPLOAD_MB * 1024 * 1024;
  if (Number(req.get("content-length") || 0) > limite) throw new ErroDeUso(`O arquivo passa do limite de ${config.MAX_UPLOAD_MB} MB.`, 413);
  const destino = path.join(config.UPLOADS, caminhoRelativo);
  await fs.promises.mkdir(path.dirname(destino), { recursive: true });
  let total = 0;
  const contador = new Transform({
    transform(parte, _codificacao, pronto) {
      total += parte.length;
      if (total > limite) return pronto(new ErroDeUso(`O arquivo passa do limite de ${config.MAX_UPLOAD_MB} MB.`, 413));
      pronto(null, parte);
    },
  });
  try {
    await pipeline(req, contador, fs.createWriteStream(destino, { flags: "wx" }));
  } catch (err) {
    await fs.promises.rm(destino, { force: true });
    throw err;
  }
  if (!total) {
    await fs.promises.rm(destino, { force: true });
    throw new ErroDeUso("O arquivo está vazio.");
  }
  return total;
}

const remover = (caminhoRelativo) => fs.promises.rm(path.join(config.UPLOADS, caminhoRelativo), { force: true });

// Cabeçalho com o nome original, aceitando acentos (RFC 6266).
function disposicao(modo, nome) {
  const simples = nome.replace(/[^\x20-\x7e]|["\\]/g, "_");
  return `${modo}; filename="${simples}"; filename*=UTF-8''${encodeURIComponent(nome)}`;
}

function enviar(res, arquivo, baixar) {
  const inline = !baixar && (arquivo.mime === "application/pdf" || arquivo.mime.startsWith("image/"));
  res.set({
    "Content-Type": arquivo.mime,
    "Content-Disposition": disposicao(inline ? "inline" : "attachment", arquivo.nome_original),
    "Cache-Control": "private, max-age=3600",
  });
  res.sendFile(path.join(config.UPLOADS, arquivo.caminho), (err) => err && !res.headersSent && res.status(404).send("Arquivo não encontrado."));
}

module.exports = { validar, gravar, remover, enviar };
