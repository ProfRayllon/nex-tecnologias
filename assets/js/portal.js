/* NEX Tecnologias — portal do cliente */
(() => {
  const { ico, esc } = NEX;
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app");
  const params = new URLSearchParams(location.search);
  let dados = null;

  const arquivoUrl = (a, baixar) => `/api/arquivos/${encodeURIComponent(a.id)}${baixar ? "?baixar=1" : ""}`;
  const porTipo = (p, tipo) => p.arquivos.filter((a) => a.tipo === tipo);
  const maisRecentes = (lista) => [...lista].sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm));

  // ---------- Topo e menu do usuário ----------
  function montarTopo() {
    const { eu, cliente, clientes } = dados;
    $("#usuario-avatar").textContent = NEX.iniciais(eu.nome);
    $("#usuario-nome").textContent = eu.nome;
    $("#usuario-cliente").textContent = eu.perfil === "admin" ? "Equipe NEX" : cliente?.nome || "";
    $("#acao-senha").innerHTML = `${ico("chave")}Alterar senha`;
    $("#acao-site").innerHTML = `${ico("site")}Site da NEX`;
    $("#acao-sair").innerHTML = `${ico("sair")}Sair`;

    if (eu.perfil === "admin") {
      $("#previa").hidden = false;
      const sel = $("#previa-cliente");
      sel.innerHTML = `<option value="">Todos os clientes</option>${clientes.map((c) => `<option value="${esc(c.id)}">${esc(c.nome)}</option>`).join("")}`;
      sel.value = params.get("cliente") || "";
      sel.onchange = () => (location.href = `/portal${sel.value ? `?cliente=${encodeURIComponent(sel.value)}` : ""}`);
    }
  }

  const botao = $("#usuario-btn");
  const menu = $("#usuario-menu");
  botao.addEventListener("click", () => {
    const abrir = menu.hidden;
    menu.hidden = !abrir;
    botao.setAttribute("aria-expanded", String(abrir));
  });
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest(".usuario")) {
      menu.hidden = true;
      botao.setAttribute("aria-expanded", "false");
    }
  });
  $("#acao-sair").addEventListener("click", NEX.sair);

  // ---------- Troca de senha ----------
  const dlgSenha = $("#dlg-senha");
  const formSenha = $("#form-senha");
  dlgSenha.querySelectorAll("[data-fechar]").forEach((b) => {
    if (!b.textContent.trim()) b.innerHTML = ico("x");
    b.addEventListener("click", () => dlgSenha.close());
  });
  $("[data-ver-senha]", dlgSenha).innerHTML = ico("olho");
  $("#acao-senha").addEventListener("click", () => {
    menu.hidden = true;
    formSenha.reset();
    $(".dlg__erro", formSenha).textContent = "";
    dlgSenha.showModal();
  });
  formSenha.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const erro = $(".dlg__erro", formSenha);
    const senha = formSenha.senha.value;
    if (senha.length < 8) return void (erro.textContent = "Use pelo menos 8 caracteres.");
    if (senha !== formSenha.confirma.value) return void (erro.textContent = "As senhas não conferem.");
    try {
      await NEX.api("POST", "/api/minha-senha", { senha });
      dlgSenha.close();
      NEX.aviso("Senha alterada com sucesso.");
    } catch (err) {
      erro.textContent = err.message;
    }
  });

  // ---------- Telas ----------
  function telaLista() {
    const { eu, cliente, projetos } = dados;
    document.title = "Área do cliente | NEX Tecnologias";
    const nome = eu.nome.split(" ")[0];
    app.innerHTML = `
      <section class="container ola">
        <span class="eyebrow">${esc(cliente?.nome || "Área do cliente")}</span>
        <h1>Olá, ${esc(nome)}! Estes são os seus projetos com a NEX.</h1>
      </section>
      <section class="container">
        ${projetos.length ? `<div class="projetos">${projetos.map(cartaoProjeto).join("")}</div>` : vazioGeral()}
      </section>`;
  }

  function cartaoProjeto(p) {
    const capa = porTipo(p, "imagem")[0];
    const st = NEX.statusDe(p.status);
    return `
      <a class="projeto" href="#/projeto/${esc(p.id)}">
        <div class="projeto__img">${capa ? `<img src="${arquivoUrl(capa)}" alt="" loading="lazy">` : ico("tela")}</div>
        <div class="projeto__corpo">
          <span><span class="status status--${p.status}">${esc(st.rotulo)}</span>${p.visivel ? "" : ' <span class="status status--off">Oculto para o cliente</span>'}</span>
          <h2>${esc(p.nome)}</h2>
          <p>${esc(p.subtitulo || (dados.eu.perfil === "admin" ? p.clienteNome : ""))}</p>
        </div>
      </a>`;
  }

  const vazioGeral = () => `
    <div class="cartao vazio" style="margin:28px 0 60px">
      ${ico("foguete")}
      <b>Seu projeto está sendo preparado</b>
      <p>Assim que a proposta estiver pronta, ela aparece aqui. Qualquer dúvida, fale com a NEX.</p>
    </div>`;

  const ABAS = [
    { id: "visao", rotulo: "Visão geral", ico: "painel" },
    { id: "orcamento", rotulo: "Orçamento", ico: "pdf", conta: (p) => porTipo(p, "orcamento").length },
    { id: "telas", rotulo: "Telas do sistema", ico: "imagem", conta: (p) => porTipo(p, "imagem").length },
    { id: "tecnologias", rotulo: "Tecnologias", ico: "camadas", conta: (p) => p.tecnologias.length },
    { id: "codigo", rotulo: "Código-fonte", ico: "codigo" },
    { id: "documentos", rotulo: "Documentos", ico: "pasta", conta: (p) => porTipo(p, "documento").length, opcional: true },
  ];

  function telaProjeto(p, aba) {
    document.title = `${p.nome} | Área do cliente NEX`;
    const codigo = maisRecentes(porTipo(p, "codigo"))[0];
    const orcamento = porTipo(p, "orcamento")[0];
    const abas = ABAS.filter((a) => !a.opcional || a.conta(p));
    if (!abas.some((a) => a.id === aba)) aba = "visao";
    const varios = dados.projetos.length > 1;

    app.innerHTML = `
      <section class="capa">
        <div class="container capa__in">
          <div>
            ${varios ? `<div class="capa__trilha"><button type="button" data-ir="#/">Meus projetos</button>${ico("direita")}<span>${esc(p.nome)}</span></div>` : ""}
            <span class="eyebrow eyebrow--dark">${esc(p.clienteNome || dados.cliente?.nome || "Projeto")}</span>
            <h1>${esc(p.nome)}</h1>
            ${p.subtitulo ? `<p class="capa__sub">${esc(p.subtitulo)}</p>` : ""}
            <div class="capa__meta">
              ${p.urlAcesso ? `<span>${ico("globo")}${esc(NEX.dominio(p.urlAcesso))}</span>` : ""}
              <span>${ico("calendario")}Atualizado em ${esc(NEX.data(p.atualizadoEm))}</span>
              ${p.visivel ? "" : '<span class="status status--off">Oculto para o cliente</span>'}
            </div>
            <div class="capa__acoes">
              ${p.urlAcesso ? `<a class="btn btn--white" href="${esc(p.urlAcesso)}" target="_blank" rel="noopener">Acessar o sistema ${ico("externo")}</a>` : ""}
              ${codigo ? `<a class="btn btn--ghost" href="${arquivoUrl(codigo, true)}">${ico("baixar")} Baixar código-fonte</a>` : ""}
              ${orcamento && !codigo ? `<a class="btn btn--ghost" href="#/projeto/${esc(p.id)}/orcamento">${ico("pdf")} Ver orçamento</a>` : ""}
            </div>
          </div>
          <div class="capa__foto" aria-hidden="true">
            <img src="/assets/img/area-do-cliente.png" alt="" width="760" height="931">
            ${p.urlAcesso ? `<div class="capa__selo">${ico("cadeado")}<div><small>Seu sistema</small><b>${esc(NEX.dominio(p.urlAcesso))}</b></div></div>` : ""}
          </div>
        </div>
      </section>

      <div class="container">
        ${etapas(p)}
        <nav class="abas" role="tablist" aria-label="Seções do projeto">
          ${abas.map((a) => `
            <a class="aba" role="tab" href="#/projeto/${esc(p.id)}/${a.id}" aria-selected="${a.id === aba}">
              ${ico(a.ico)}${a.rotulo}${a.conta && a.conta(p) ? ` <span class="aba__n">${a.conta(p)}</span>` : ""}
            </a>`).join("")}
        </nav>
        <section role="tabpanel">${CONTEUDO[aba](p)}</section>
      </div>`;
  }

  function etapas(p) {
    const atual = NEX.STATUS.findIndex((s) => s.id === p.status);
    const concluido = p.status === "entregue";
    return `
      <div class="etapas" aria-label="Andamento do projeto">
        <ol>
          ${NEX.STATUS.map((s, i) => {
            const feita = i < atual || (concluido && i === atual);
            const classe = feita ? "is-feita" : i === atual ? "is-atual" : "";
            return `<li class="etapa ${classe}"${i === atual ? ' aria-current="step"' : ""}>
              <span class="etapa__n">${feita ? ico("check") : i + 1}</span>
              <span>${s.etapa}<small>${s.dica}</small></span>
            </li>`;
          }).join("")}
        </ol>
      </div>`;
  }

  const paragrafos = (t) => esc(t).split(/\n{2,}/).map((b) => `<p>${b.replace(/\n/g, "<br>")}</p>`).join("");

  const vazio = (icone, titulo, texto) => `<div class="cartao vazio">${ico(icone)}<b>${titulo}</b><p>${texto}</p></div>`;

  function linhaArquivo(a, { selo = "", ver = true } = {}) {
    const classe = a.mime === "application/pdf" ? "arquivo__ico--pdf" : a.tipo === "codigo" ? "arquivo__ico--zip" : "";
    const icone = a.mime === "application/pdf" ? "pdf" : a.tipo === "codigo" ? "zip" : a.tipo === "imagem" ? "imagem" : "doc";
    const visualizavel = ver && (a.mime === "application/pdf" || a.mime.startsWith("image/"));
    return `
      <div class="arquivo">
        <span class="arquivo__ico ${classe}">${ico(icone)}</span>
        <div class="arquivo__info">
          <b>${esc(a.titulo || a.nome)}${selo ? `<span class="selo">${selo}</span>` : ""}</b>
          <span>${esc(a.nome)} · ${NEX.tamanho(a.tamanho)} · enviado em ${esc(NEX.data(a.criadoEm))}</span>
          ${a.legenda ? `<span style="display:block">${esc(a.legenda)}</span>` : ""}
        </div>
        <div class="arquivo__acoes">
          ${visualizavel ? `<a class="btn btn--outline btn--sm" href="${arquivoUrl(a)}" target="_blank" rel="noopener">${ico("olho")} Abrir</a>` : ""}
          <a class="btn btn--primary btn--sm" href="${arquivoUrl(a, true)}">${ico("baixar")} Baixar</a>
        </div>
      </div>`;
  }

  // Orçamento e documentos: cartão com os dados e os botões, e a prévia do PDF ao lado.
  function documentoPdf(a, selo = "") {
    const pdf = a.mime === "application/pdf";
    return `
      <div class="doc${pdf ? "" : " doc--sem-previa"}">
        <div class="cartao doc__info">
          <span class="arquivo__ico${pdf ? " arquivo__ico--pdf" : ""}">${ico(pdf ? "pdf" : "doc")}</span>
          <h2>${esc(a.titulo || a.nome)}</h2>
          ${selo ? `<span class="selo">${selo}</span>` : ""}
          ${a.legenda ? `<p>${esc(a.legenda)}</p>` : ""}
          <dl class="doc__dados">
            <div><dt>Arquivo</dt><dd>${esc(a.nome)}</dd></div>
            <div><dt>Tamanho</dt><dd>${NEX.tamanho(a.tamanho)}</dd></div>
            <div><dt>Publicado em</dt><dd>${esc(NEX.data(a.criadoEm))}</dd></div>
          </dl>
          <div class="doc__acoes">
            <a class="btn btn--primary btn--block" href="${arquivoUrl(a, true)}">${ico("baixar")} Baixar ${pdf ? "PDF" : "arquivo"}</a>
            ${pdf ? `<a class="btn btn--outline btn--block" href="${arquivoUrl(a)}" target="_blank" rel="noopener">${ico("externo")} Abrir em nova aba</a>` : ""}
          </div>
        </div>
        ${pdf ? `<div class="doc__previa"><iframe src="${arquivoUrl(a)}#view=FitH" title="${esc(a.titulo)}" loading="lazy"></iframe></div>` : ""}
      </div>`;
  }

  function ficha(p) {
    const linhas = [
      ["Cliente", esc(p.clienteNome || dados.cliente?.nome || "")],
      ["Situação", `<span class="status status--${p.status}">${esc(NEX.statusDe(p.status).rotulo)}</span>`],
      p.inicio && ["Início", esc(NEX.dataLonga(p.inicio))],
      p.entrega && ["Entrega", esc(NEX.dataLonga(p.entrega))],
      p.urlAcesso && ["Endereço", `<a href="${esc(p.urlAcesso)}" target="_blank" rel="noopener">${esc(NEX.dominio(p.urlAcesso))}</a>`],
      ...p.informacoes.map((i) => [esc(i.rotulo), esc(i.valor)]),
    ].filter(Boolean);
    return `<dl class="ficha">${linhas.map(([r, v]) => `<div><dt>${r}</dt><dd>${v}</dd></div>`).join("")}</dl>`;
  }

  // Login de administrador do sistema entregue; a senha fica oculta até o cliente pedir.
  function acessoSistema(p) {
    if (!p.acessoUsuario && !p.acessoSenha) return "";
    const linha = (rotulo, valor, segredo) => `
      <div class="credencial-linha">
        <span>${rotulo}</span>
        <code${segredo ? ' data-segredo="1"' : ""}>${segredo ? "••••••••••" : esc(valor)}</code>
        ${segredo ? `<button type="button" class="icobtn" data-revelar aria-label="Mostrar senha">${ico("olho")}</button>` : ""}
        <button type="button" class="icobtn" data-copiar-valor="${esc(valor)}" aria-label="Copiar ${rotulo.toLowerCase()}">${ico("copiar")}</button>
      </div>`;
    return `
      <div class="cartao acesso">
        <h3>${ico("chave")} Acesso administrativo</h3>
        <p class="small muted">Login de administrador do ${esc(p.nome)}.</p>
        ${p.urlAcesso ? linha("Endereço", p.urlAcesso, false) : ""}
        ${p.acessoUsuario ? linha("Usuário", p.acessoUsuario, false) : ""}
        ${p.acessoSenha ? linha("Senha", p.acessoSenha, true) : ""}
        ${p.urlAcesso ? `<a class="btn btn--primary btn--sm btn--block" href="${esc(p.urlAcesso)}" target="_blank" rel="noopener">Entrar no sistema ${ico("externo")}</a>` : ""}
        <p class="small muted">Por segurança, troque a senha no primeiro acesso ao sistema.</p>
      </div>`;
  }

  const ajuda = () => `
    <div class="cartao ajuda">
      <div>
        <h3>Precisa de ajuda?</h3>
        <p>A equipe da NEX acompanha o seu sistema. Fale com a gente pelo canal que preferir.</p>
      </div>
      <div class="ajuda__links">
        <a href="https://wa.me/${NEX.CONTATO.whatsapp}?text=${encodeURIComponent("Olá! Sou cliente da NEX e preciso de ajuda com o meu sistema.")}" target="_blank" rel="noopener">${ico("whats")}WhatsApp</a>
        <a href="mailto:${NEX.CONTATO.email}">${ico("email")}${NEX.CONTATO.email}</a>
      </div>
    </div>`;

  const CONTEUDO = {
    visao(p) {
      const acesso = acessoSistema(p);
      const sobre = `
        <div class="cartao">
          <h2>Sobre o sistema</h2>
          <div class="texto">${p.descricao ? paragrafos(p.descricao) : '<p class="muted">A descrição do projeto será publicada em breve.</p>'}</div>
        </div>`;
      return `
        ${acesso ? `<div class="grade-2 grade-2--igual">${sobre}${acesso}</div>` : sobre}
        ${p.destaques.length ? `
          <div class="cartao">
            <h2>O que o sistema entrega</h2>
            <ul class="lista-ok">${p.destaques.map((d) => `<li>${ico("check")}<span>${esc(d)}</span></li>`).join("")}</ul>
          </div>` : ""}
        <div class="cartao"><h2>Ficha do projeto</h2>${ficha(p)}</div>
        ${ajuda()}`;
    },

    orcamento(p) {
      const lista = porTipo(p, "orcamento");
      if (!lista.length) return vazio("pdf", "Orçamento ainda não publicado", "Assim que a proposta for enviada, o PDF fica disponível aqui.");
      return lista.map((a, i) => documentoPdf(a, lista.length > 1 && i === 0 ? "Principal" : "")).join("");
    },

    telas(p) {
      const imgs = porTipo(p, "imagem");
      if (!imgs.length) return vazio("imagem", "Telas em preparação", "As imagens do sistema serão publicadas aqui.");
      const a = imgs[0];
      return `
        <div class="carrossel" data-carrossel>
          <div class="carrossel__palco">
            <img class="carrossel__img" src="${arquivoUrl(a)}" alt="${esc(a.titulo)}" data-lupa="0">
            ${imgs.length > 1 ? `
              <button type="button" class="carrossel__seta carrossel__seta--ant" data-mover-tela="-1" aria-label="Tela anterior">${ico("esquerda")}</button>
              <button type="button" class="carrossel__seta carrossel__seta--prox" data-mover-tela="1" aria-label="Próxima tela">${ico("direita")}</button>` : ""}
            <span class="carrossel__contador">1 / ${imgs.length}</span>
          </div>
          <div class="carrossel__legenda"><b>${esc(a.titulo)}</b><span>${esc(a.legenda)}</span></div>
          <div class="carrossel__miniaturas" role="tablist" aria-label="Telas do sistema">
            ${imgs.map((t, i) => `
              <button type="button" class="miniatura${i === 0 ? " is-ativa" : ""}" data-ir-tela="${i}" role="tab" aria-selected="${i === 0}">
                <img src="${arquivoUrl(t)}" alt="" loading="lazy"><span>${esc(t.titulo)}</span>
              </button>`).join("")}
          </div>
        </div>`;
    },

    tecnologias(p) {
      if (!p.tecnologias.length) return vazio("camadas", "Tecnologias em definição", "A lista de tecnologias do projeto aparece aqui.");
      const grupos = new Map();
      for (const t of p.tecnologias) grupos.set(t.categoria, [...(grupos.get(t.categoria) || []), t.nome]);
      return `
        <div class="cartao">
          <div class="cartao__topo">
            <h2>Tecnologias e ferramentas</h2>
            <span class="muted small">${p.tecnologias.length} itens em ${grupos.size} categorias</span>
          </div>
          <div class="techs">
            ${[...grupos].map(([cat, nomes]) => `
              <div class="tech">
                <h3>${esc(cat)}</h3>
                <ul>${nomes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
              </div>`).join("")}
          </div>
        </div>`;
    },

    codigo(p) {
      const versoes = maisRecentes(porTipo(p, "codigo"));
      const cliente = esc(p.clienteNome || dados.cliente?.nome || "o cliente");
      return `
        <div class="cartao posse">
          <span class="posse__ico">${ico("escudo")}</span>
          <div>
            <h2>O código-fonte é seu</h2>
            <p>Este sistema foi desenvolvido pela NEX Tecnologias para <b>${cliente}</b>. Você pode baixar a versão entregue do código a qualquer momento e guardá-la com a sua equipe.</p>
            <ul>
              <li>${ico("check")}Pacote completo do projeto, pronto para instalar</li>
              <li>${ico("check")}Instruções de instalação e publicação no próprio pacote</li>
              <li>${ico("check")}Cada nova entrega fica registrada aqui, com data</li>
            </ul>
          </div>
        </div>
        <div class="cartao">
          <div class="cartao__topo">
            <h2>Versões entregues</h2>
            ${p.urlCodigo ? `<a class="btn btn--soft btn--sm" href="${esc(p.urlCodigo)}" target="_blank" rel="noopener">${ico("codigo")} Repositório ${ico("externo")}</a>` : ""}
          </div>
          ${versoes.length ? versoes.map((a, i) => linhaArquivo(a, { selo: i === 0 ? "Mais recente" : "", ver: false })).join("") : '<div class="envio__vazio">O pacote do código será publicado aqui na entrega.</div>'}
        </div>`;
    },

    documentos(p) {
      return porTipo(p, "documento").map((a) => documentoPdf(a)).join("");
    },
  };

  // ---------- Ampliar imagens ----------
  let lupa = null;
  function abrirLupa(imgs, i) {
    fecharLupa();
    lupa = document.createElement("div");
    lupa.className = "lupa";
    lupa.setAttribute("role", "dialog");
    lupa.setAttribute("aria-modal", "true");
    const mostrar = (n) => {
      i = (n + imgs.length) % imgs.length;
      const a = imgs[i];
      lupa.innerHTML = `
        <div class="lupa__topo"><span><b>${esc(a.titulo)}</b>${a.legenda ? ` · ${esc(a.legenda)}` : ""} <span class="muted">(${i + 1}/${imgs.length})</span></span>
          <span><a class="icobtn" href="${arquivoUrl(a, true)}" aria-label="Baixar imagem">${ico("baixar")}</a> <button class="icobtn" data-acao="fechar" aria-label="Fechar">${ico("x")}</button></span></div>
        <div class="lupa__img"><img src="${arquivoUrl(a)}" alt="${esc(a.titulo)}"></div>
        ${imgs.length > 1 ? `<div class="lupa__nav"><button class="icobtn" data-acao="ant" aria-label="Anterior">${ico("esquerda")}</button><button class="icobtn" data-acao="prox" aria-label="Próxima">${ico("direita")}</button></div>` : "<div></div>"}`;
    };
    lupa.addEventListener("click", (ev) => {
      const acao = ev.target.closest("[data-acao]")?.dataset.acao;
      if (acao === "fechar" || ev.target === lupa || ev.target.classList.contains("lupa__img")) fecharLupa();
      if (acao === "ant") mostrar(i - 1);
      if (acao === "prox") mostrar(i + 1);
    });
    lupa.teclas = (ev) => {
      if (ev.key === "Escape") fecharLupa();
      if (ev.key === "ArrowLeft") mostrar(i - 1);
      if (ev.key === "ArrowRight") mostrar(i + 1);
    };
    document.addEventListener("keydown", lupa.teclas);
    mostrar(i);
    document.body.append(lupa);
    document.body.style.overflow = "hidden";
  }
  function fecharLupa() {
    if (!lupa) return;
    document.removeEventListener("keydown", lupa.teclas);
    lupa.remove();
    lupa = null;
    document.body.style.overflow = "";
  }

  // ---------- Carrossel das telas ----------
  let telaAtual = 0;
  function mostrarTela(i) {
    const caixa = $("[data-carrossel]");
    const imgs = porTipo(projetoAtual(), "imagem");
    if (!caixa || !imgs.length) return;
    telaAtual = (i + imgs.length) % imgs.length;
    const a = imgs[telaAtual];
    const img = $(".carrossel__img", caixa);
    img.src = arquivoUrl(a);
    img.alt = a.titulo;
    img.dataset.lupa = telaAtual;
    $(".carrossel__contador", caixa).textContent = `${telaAtual + 1} / ${imgs.length}`;
    $(".carrossel__legenda", caixa).innerHTML = `<b>${esc(a.titulo)}</b><span>${esc(a.legenda)}</span>`;
    caixa.querySelectorAll("[data-ir-tela]").forEach((m, j) => {
      m.classList.toggle("is-ativa", j === telaAtual);
      m.setAttribute("aria-selected", String(j === telaAtual));
      if (j === telaAtual) m.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    const proxima = imgs[(telaAtual + 1) % imgs.length];
    if (proxima) new Image().src = arquivoUrl(proxima);
  }
  document.addEventListener("keydown", (ev) => {
    if (lupa || !$("[data-carrossel]") || /input|textarea|select/i.test(ev.target.tagName)) return;
    if (ev.key === "ArrowLeft") mostrarTela(telaAtual - 1);
    if (ev.key === "ArrowRight") mostrarTela(telaAtual + 1);
  });

  app.addEventListener("click", (ev) => {
    const mover = ev.target.closest("[data-mover-tela]");
    if (mover) return mostrarTela(telaAtual + Number(mover.dataset.moverTela));
    const irTela = ev.target.closest("[data-ir-tela]");
    if (irTela) return mostrarTela(Number(irTela.dataset.irTela));
    const copiar = ev.target.closest("[data-copiar-valor]");
    if (copiar) NEX.copiar(copiar.dataset.copiarValor);
    const revelar = ev.target.closest("[data-revelar]");
    if (revelar) {
      const campo = $("[data-segredo]", revelar.parentElement);
      const mostrar = campo.textContent.startsWith("•");
      campo.textContent = mostrar ? $("[data-copiar-valor]", revelar.parentElement).dataset.copiarValor : "••••••••••";
      revelar.innerHTML = ico(mostrar ? "olhoOff" : "olho");
      revelar.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    }
    const ir = ev.target.closest("[data-ir]");
    if (ir) location.hash = ir.dataset.ir;
    const alvo = ev.target.closest("[data-lupa]");
    if (alvo) abrirLupa(porTipo(projetoAtual(), "imagem"), Number(alvo.dataset.lupa));
  });
  app.addEventListener("keydown", (ev) => {
    const alvo = ev.target.closest("[data-lupa]");
    if (alvo && (ev.key === "Enter" || ev.key === " ")) {
      ev.preventDefault();
      abrirLupa(porTipo(projetoAtual(), "imagem"), Number(alvo.dataset.lupa));
    }
  });

  // ---------- Rotas (#/projeto/ID/aba) ----------
  function rota() {
    const [, tipo, id, aba] = location.hash.split("/");
    return tipo === "projeto" ? { id: decodeURIComponent(id || ""), aba } : {};
  }

  function projetoAtual() {
    const { id } = rota();
    return dados.projetos.find((p) => p.id === id) || (dados.projetos.length === 1 ? dados.projetos[0] : null);
  }

  let ultimoProjeto = null;
  function desenhar() {
    fecharLupa();
    telaAtual = 0;
    const p = projetoAtual();
    if (!p) return telaLista();
    telaProjeto(p, rota().aba);
    if (ultimoProjeto !== p.id) window.scrollTo(0, 0);
    else $(".abas")?.scrollIntoView({ block: "nearest" });
    ultimoProjeto = p.id;
  }

  async function iniciar() {
    $("#ano").textContent = new Date().getFullYear();
    const cliente = params.get("cliente");
    try {
      dados = await NEX.api("GET", `/api/portal${cliente ? `?cliente=${encodeURIComponent(cliente)}` : ""}`);
    } catch (err) {
      app.innerHTML = vazio("info", "Não foi possível carregar", esc(err.message));
      return;
    }
    if (dados.eu.trocarSenha) return location.replace("/entrar");
    montarTopo();
    window.addEventListener("hashchange", desenhar);
    desenhar();
  }

  iniciar();
})();
