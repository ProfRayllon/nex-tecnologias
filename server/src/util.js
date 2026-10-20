class ErroDeUso extends Error {
  constructor(mensagem, status = 400) {
    super(mensagem);
    this.status = status;
  }
}

const texto = (v, max = 2000) => String(v ?? "").trim().slice(0, max);
const assincrono = (fn) => (req, res, next) => fn(req, res, next).catch(next);
const emailValido = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

// Só http(s): evita "javascript:" e afins nos links mostrados ao cliente.
function url(v) {
  const s = texto(v, 500);
  if (!s) return "";
  const comProtocolo = /^https?:\/\//i.test(s) ? s : `https://${s}`;
  try {
    const endereco = new URL(comProtocolo);
    // "https://site.com.br/" fica "https://site.com.br", como as pessoas digitam.
    return endereco.pathname === "/" && !endereco.search && !endereco.hash ? endereco.origin : endereco.toString();
  } catch {
    throw new ErroDeUso(`Endereço inválido: ${s}`);
  }
}

function data(v) {
  const s = texto(v, 10);
  if (!s) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ErroDeUso(`Data inválida: ${s}`);
  return s;
}

module.exports = { ErroDeUso, texto, assincrono, emailValido, url, data };
