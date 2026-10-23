// Envia ao portal os arquivos de uma pasta de entrega, conforme o entrega.json dela.
// Uso: NEX_URL=https://nextecnologias.com.br ADMIN_EMAIL=... ADMIN_PASSWORD=... node deploy/enviar-entrega.mjs entregas/prime-edu
// Arquivos com o mesmo nome já enviados ao projeto são pulados, então dá para rodar de novo sem duplicar.
import fs from "node:fs";
import path from "node:path";

const pasta = process.argv[2];
const base = (process.env.NEX_URL || "https://nextecnologias.com.br").replace(/\/$/, "");
if (!pasta || !process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error("Uso: NEX_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... node deploy/enviar-entrega.mjs <pasta-da-entrega>");
  process.exit(1);
}
const { projeto, arquivos } = JSON.parse(fs.readFileSync(path.join(pasta, "entrega.json"), "utf8"));

let cookie = "";
async function api(metodo, rota, corpo, tipo = "application/json") {
  const r = await fetch(base + rota, {
    method: metodo,
    headers: { cookie, origin: base, ...(corpo ? { "content-type": tipo } : {}) },
    body: corpo && tipo === "application/json" ? JSON.stringify(corpo) : corpo,
    duplex: "half",
  });
  const json = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${metodo} ${rota}: ${json.erro || r.status}`);
  return { json, r };
}

const { r } = await api("POST", "/api/entrar", { email: process.env.ADMIN_EMAIL, senha: process.env.ADMIN_PASSWORD });
cookie = (r.headers.get("set-cookie") || "").split(";")[0];
try {
  const { json: estado } = await api("GET", "/api/admin/estado");
  const p = estado.projetos.find((x) => x.id === projeto);
  if (!p) throw new Error(`Projeto ${projeto} não encontrado (a migração do cliente já rodou?).`);
  const existentes = new Set(p.arquivos.map((a) => `${a.tipo}/${a.nome}`));
  for (const item of arquivos) {
    const nome = path.basename(item.arquivo);
    if (existentes.has(`${item.tipo}/${nome}`)) { console.log(`já enviado: ${nome}`); continue; }
    const arquivo = path.join(pasta, item.arquivo);
    const rota = `/api/admin/projetos/${encodeURIComponent(projeto)}/arquivos?tipo=${item.tipo}&nome=${encodeURIComponent(nome)}&titulo=${encodeURIComponent(item.titulo || "")}`;
    const { json } = await api("POST", rota, fs.createReadStream(arquivo), "application/octet-stream");
    if (item.legenda) await api("PUT", `/api/admin/arquivos/${json.id}`, { titulo: item.titulo || "", legenda: item.legenda });
    console.log(`enviado: ${nome} (${(fs.statSync(arquivo).size / 1e6).toFixed(1)} MB)`);
  }
} finally {
  await api("POST", "/api/sair").catch(() => {});
}
