const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const N = 16384;

async function gerarHash(senha) {
  const salt = crypto.randomBytes(16).toString("hex");
  const chave = await scrypt(String(senha), salt, 64, { N });
  return `scrypt$${N}$${salt}$${chave.toString("hex")}`;
}

function iguais(a, b) {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

async function conferir(senha, hash) {
  const [tipo, n, salt, esperado] = String(hash).split("$");
  if (tipo !== "scrypt") return false;
  const chave = await scrypt(String(senha), salt, 64, { N: Number(n) });
  return iguais(chave.toString("hex"), esperado);
}

// Senha provisória legível (sem 0/O, 1/l/I), entregue ao cliente no primeiro acesso.
function senhaProvisoria(tamanho = 10) {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  return Array.from(crypto.randomBytes(tamanho), (b) => letras[b % letras.length]).join("");
}

module.exports = { gerarHash, conferir, senhaProvisoria };
