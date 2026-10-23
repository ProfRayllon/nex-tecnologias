/* =========================================================
   NEX Tecnologias — utilidades da área do cliente e do painel
   ========================================================= */
window.NEX = (() => {
  // Contato exibido no portal. TODO: trocar 5500000000000 pelo número real (55 + DDD + número), como no site.
  const CONTATO = { email: "contato@nextecnologias.com.br", whatsapp: "5500000000000" };

  const STATUS = [
    { id: "proposta", rotulo: "Proposta enviada", etapa: "Proposta", dica: "Orçamento em análise" },
    { id: "aprovado", rotulo: "Aprovado", etapa: "Aprovação", dica: "Projeto contratado" },
    { id: "desenvolvimento", rotulo: "Em desenvolvimento", etapa: "Desenvolvimento", dica: "Construção do sistema" },
    { id: "homologacao", rotulo: "Em validação", etapa: "Validação", dica: "Testes com o cliente" },
    { id: "entregue", rotulo: "Entregue", etapa: "Entrega", dica: "Sistema em produção" },
  ];
  const statusDe = (id) => STATUS.find((s) => s.id === id) || STATUS[0];

  // Ícones no traço do site (stroke 2, cantos arredondados).
  const P = {
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    externo: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    baixar: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
    enviar: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
    olho: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    olhoOff: '<path d="M3 3l18 18M10.6 5.1A10.6 10.6 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17.3 17.3 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    doc: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    pdf: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M8.5 16v-4h1.2a1.2 1.2 0 0 1 0 2.4H8.5M13 12v4h.8a1.6 1.6 0 0 0 1.6-1.6v-.8A1.6 1.6 0 0 0 13.8 12z"/>',
    imagem: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
    video: '<rect x="2" y="5" width="14" height="14" rx="2"/><path d="m16 10 6-3.5v11L16 14"/>',
    codigo: '<path d="m16 18 6-6-6-6M8 6l-6 6 6 6"/>',
    zip: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M11 5h1M11 8h1M11 11h1M10 14h2v3h-2z"/>',
    camadas: '<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 13 9 5 9-5"/>',
    painel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    pasta: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    predio: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16M16 9h2a2 2 0 0 1 2 2v10M3 21h18M8 7h4M8 11h4M8 15h4"/>',
    usuarios: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6.5 6.5 0 0 1 3.5 6"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    chave: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 9.2-9.2M17 6l3 3M14 9l2 2"/>',
    cadeado: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    escudo: '<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    sair: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3"/>',
    email: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    whats: '<path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-1.8-1.8l.8-1-1-2z"/>',
    globo: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    calendario: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
    editar: '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    lixo: '<path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    mais: '<path d="M12 5v14M5 12h14"/>',
    cima: '<path d="m6 15 6-6 6 6"/>',
    baixo: '<path d="m6 9 6 6 6-6"/>',
    esquerda: '<path d="m15 6-6 6 6 6"/>',
    direita: '<path d="m9 6 6 6-6 6"/>',
    copiar: '<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
    mensagem: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    atividade: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
    servidor: '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    banco: '<ellipse cx="12" cy="5.5" rx="8" ry="2.5"/><path d="M4 5.5v13c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5v-13M4 12c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5"/>',
    tela: '<rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    ferramenta: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    foguete: '<path d="M5 15c-1.5 1.5-2 5-2 5s3.5-.5 5-2M9 12a17 17 0 0 1 9-9c1 0 3 2 3 3a17 17 0 0 1-9 9z"/><path d="M9 12H5l2-4h4M12 15v4l4-2v-4"/>',
    site: '<path d="M3 12 12 3l9 9M5 10v10h14V10"/>',
  };
  const ico = (nome, extra = "") => `<svg viewBox="0 0 24 24" class="ico ${extra}" aria-hidden="true">${P[nome] || P.info}</svg>`;

  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);

  function tamanho(bytes) {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
    if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1).replace(".", ",")} MB`;
    return `${(n / 1024 ** 3).toFixed(2).replace(".", ",")} GB`;
  }

  // "2026-10-20" (só data) não pode virar o dia anterior por causa do fuso.
  const paraData = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`) : new Date(v));
  const data = (v) => (v ? paraData(v).toLocaleDateString("pt-BR") : "");
  const dataLonga = (v) => (v ? paraData(v).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }) : "");
  const dataHora = (v) => (v ? new Date(v).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "");

  function relativo(v) {
    if (!v) return "nunca";
    const min = Math.round((Date.now() - new Date(v)) / 60000);
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `há ${h} h`;
    const d = Math.round(h / 24);
    if (d < 30) return `há ${d} dia${d > 1 ? "s" : ""}`;
    return data(v);
  }

  const iniciais = (nome) => String(nome || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const dominio = (url) => {
    try {
      return new URL(url).host;
    } catch {
      return url || "";
    }
  };

  class ErroApi extends Error {
    constructor(mensagem, status) {
      super(mensagem);
      this.status = status;
    }
  }

  async function api(metodo, url, corpo) {
    const opcoes = { method: metodo, headers: {}, credentials: "same-origin" };
    if (corpo !== undefined) {
      opcoes.headers["Content-Type"] = "application/json";
      opcoes.body = JSON.stringify(corpo);
    }
    const res = await fetch(url, opcoes);
    const json = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.endsWith("/entrar")) {
      location.href = `/entrar?volta=${encodeURIComponent(location.pathname + location.search + location.hash)}`;
      throw new ErroApi("Sessão expirada.", 401);
    }
    if (!res.ok) throw new ErroApi(json.erro || "Não foi possível concluir. Tente novamente.", res.status);
    return json;
  }

  // Envio de arquivo com progresso (fetch ainda não informa o progresso do upload).
  function enviarArquivo(url, arquivo, aoProgredir) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.upload.onprogress = (e) => e.lengthComputable && aoProgredir?.(e.loaded / e.total);
      xhr.onload = () => {
        let json = {};
        try {
          json = JSON.parse(xhr.responseText);
        } catch { /* resposta sem JSON */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(json);
        else reject(new ErroApi(json.erro || `Falha no envio (${xhr.status}).`, xhr.status));
      };
      xhr.onerror = () => reject(new ErroApi("A conexão caiu durante o envio.", 0));
      xhr.send(arquivo);
    });
  }

  function aviso(mensagem, tipo = "ok") {
    let caixa = document.querySelector(".avisos");
    if (!caixa) {
      caixa = document.createElement("div");
      caixa.className = "avisos";
      caixa.setAttribute("role", "status");
      document.body.append(caixa);
    }
    const el = document.createElement("div");
    el.className = `aviso aviso--${tipo}`;
    el.innerHTML = `${ico(tipo === "erro" ? "x" : "check")}<span>${esc(mensagem)}</span>`;
    caixa.append(el);
    setTimeout(() => el.remove(), 4200);
  }

  async function copiar(textoParaCopiar) {
    try {
      await navigator.clipboard.writeText(textoParaCopiar);
      aviso("Copiado para a área de transferência.");
    } catch {
      aviso("Não foi possível copiar. Selecione e copie manualmente.", "erro");
    }
  }

  async function sair() {
    await api("POST", "/api/sair").catch(() => {});
    location.href = "/entrar";
  }

  // Mostrar/ocultar senha nos campos com botão [data-ver-senha].
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest("[data-ver-senha]");
    if (!btn) return;
    const campo = btn.parentElement.querySelector("input");
    const mostrar = campo.type === "password";
    campo.type = mostrar ? "text" : "password";
    btn.innerHTML = ico(mostrar ? "olhoOff" : "olho");
    btn.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
  });

  return { CONTATO, STATUS, statusDe, ico, esc, tamanho, data, dataLonga, dataHora, relativo, iniciais, dominio, api, enviarArquivo, aviso, copiar, sair };
})();
