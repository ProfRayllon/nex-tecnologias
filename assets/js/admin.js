/* NEX Tecnologias — painel administrativo (clientes, projetos, arquivos, acessos e contatos) */
(() => {
  const { ico, esc } = NEX;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const main = $("#conteudo");
  let estado = null;

  const TIPOS_ARQUIVO = [
    { id: "orcamento", rotulo: "Orçamento", dica: "PDF da proposta", aceita: ".pdf", multiplo: false, icone: "pdf" },
    { id: "imagem", rotulo: "Telas do sistema", dica: "PNG, JPG ou WEBP", aceita: ".png,.jpg,.jpeg,.webp,.gif", multiplo: true, icone: "imagem" },
    { id: "codigo", rotulo: "Código-fonte", dica: "ZIP, RAR, 7Z ou TAR.GZ", aceita: ".zip,.rar,.7z,.gz,.tgz", multiplo: false, icone: "zip" },
    { id: "video", rotulo: "Vídeo", dica: "MP4 ou WEBM", aceita: ".mp4,.webm", multiplo: true, icone: "video" },
    { id: "documento", rotulo: "Outros documentos", dica: "Contrato, manual, termo de entrega…", aceita: ".pdf,.docx,.xlsx,.pptx,.txt,.md,.zip,.png,.jpg,.jpeg", multiplo: true, icone: "doc" },
  ];

  const clientePorId = (id) => estado.clientes.find((c) => c.id === id);
  const nomeCliente = (id) => clientePorId(id)?.nome || "—";
  const opcoesClientes = (atual) => estado.clientes.map((c) => `<option value="${esc(c.id)}"${c.id === atual ? " selected" : ""}>${esc(c.nome)}</option>`).join("");
  const statusTag = (s) => `<span class="status status--${s}">${esc(NEX.statusDe(s).rotulo)}</span>`;
  const portalDe = (clienteId, projetoId) => `/portal?cliente=${encodeURIComponent(clienteId)}${projetoId ? `#/projeto/${encodeURIComponent(projetoId)}` : ""}`;

  // ---------- Ícones estáticos do HTML ----------
  $$("[data-ico]").forEach((el) => (el.outerHTML = ico(el.dataset.ico)));

  // ---------- Diálogos ----------
  function dialogo({ titulo, corpo, botao = "Salvar", largo = false, cancelar = "Cancelar", aoEnviar }) {
    const dlg = document.createElement("dialog");
    dlg.className = `dlg${largo ? " dlg--largo" : ""}`;
    dlg.innerHTML = `
      <form novalidate>
        <div class="dlg__topo"><h2>${titulo}</h2><button type="button" class="icobtn" data-fechar aria-label="Fechar">${ico("x")}</button></div>
        <div class="dlg__corpo">${corpo}<p class="dlg__erro" role="alert"></p></div>
        <div class="dlg__rodape">
          ${cancelar ? `<button type="button" class="btn btn--outline btn--sm" data-fechar>${cancelar}</button>` : ""}
          ${botao ? `<button type="submit" class="btn btn--primary btn--sm">${botao}</button>` : ""}
        </div>
      </form>`;
    document.body.append(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    $$("[data-fechar]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
    const form = $("form", dlg);
    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const erro = $(".dlg__erro", dlg);
      const enviar = $("[type=submit]", dlg);
      erro.textContent = "";
      if (enviar) enviar.disabled = true;
      try {
        await aoEnviar?.(form, dlg);
      } catch (err) {
        erro.textContent = err.message;
      } finally {
        if (enviar) enviar.disabled = false;
      }
    });
    dlg.showModal();
    return dlg;
  }

  function confirmar(titulo, texto, botao = "Excluir") {
    return new Promise((resolve) => {
      let ok = false;
      const dlg = dialogo({
        titulo,
        corpo: `<p>${texto}</p>`,
        botao,
        aoEnviar: (_f, d) => {
          ok = true;
          d.close();
        },
      });
      $("[type=submit]", dlg).className = "btn btn--danger btn--sm";
      dlg.addEventListener("close", () => resolve(ok));
    });
  }

  // Mensagem pronta para mandar ao cliente com o acesso dele.
  function mostrarCredencial(usuario, senha, titulo = "Acesso criado") {
    const endereco = `${location.origin}/entrar`;
    const cliente = usuario.clienteId ? clientePorId(usuario.clienteId)?.nome : "";
    const mensagem = [
      `Olá, ${usuario.nome.split(" ")[0]}! Seu acesso à Área do Cliente da NEX Tecnologias está pronto.`,
      cliente ? `Lá você acompanha o projeto ${cliente}: orçamento, telas, link do sistema e o código-fonte.` : "",
      "",
      `Endereço: ${endereco}`,
      `E-mail: ${usuario.email}`,
      `Senha provisória: ${senha}`,
      "",
      "No primeiro acesso, o sistema pede para você criar uma senha pessoal.",
    ].filter((l, i, arr) => l || arr[i - 1]).join("\n");
    const dlg = dialogo({
      titulo,
      corpo: `
        <p>Copie a mensagem abaixo e envie ao cliente. <b>A senha não aparece de novo</b> (se perder, gere outra).</p>
        <div class="credencial">${esc(mensagem)}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button type="button" class="btn btn--primary btn--sm" data-copiar>${ico("copiar")} Copiar mensagem</button>
          <a class="btn btn--outline btn--sm" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(mensagem)}">${ico("whats")} Enviar pelo WhatsApp</a>
          <a class="btn btn--outline btn--sm" href="mailto:${esc(usuario.email)}?subject=${encodeURIComponent("Seu acesso à Área do Cliente NEX")}&body=${encodeURIComponent(mensagem)}">${ico("email")} Enviar por e-mail</a>
        </div>`,
      botao: "",
      cancelar: "Fechar",
    });
    $("[data-copiar]", dlg).addEventListener("click", () => NEX.copiar(mensagem));
  }

  // ---------- Dados ----------
  async function carregar() {
    estado = await NEX.api("GET", "/api/admin/estado");
    $("#eu-nome").textContent = estado.eu.nome;
    $("#eu-email").textContent = estado.eu.email;
    const naoLidos = estado.contatos.filter((c) => !c.lido).length;
    $("#nao-lidos").hidden = !naoLidos;
    $("#nao-lidos").textContent = naoLidos;
  }

  async function recarregar() {
    await carregar();
    desenhar();
  }

  // ---------- Telas ----------
  const topo = (titulo, sub = "", acoes = "", voltar = "") => `
    <div class="adm__topo">
      <div>${voltar}<h1>${titulo}</h1>${sub ? `<p>${sub}</p>` : ""}</div>
      ${acoes ? `<div class="acoes">${acoes}</div>` : ""}
    </div>`;

  const vazio = (icone, titulo, texto) => `<div class="cartao vazio">${ico(icone)}<b>${titulo}</b><p>${texto}</p></div>`;

  const ACOES_REGISTRO = { entrou: "entrou no portal" };
  const textoRegistro = (r) => `<b>${esc(r.usuarioNome || "Usuário removido")}</b> ${esc(ACOES_REGISTRO[r.acao] || r.acao)}${r.detalhe ? ` <small>${esc(r.detalhe)}</small>` : ""}`;
  const iconeRegistro = (acao) => (acao === "entrou" ? "usuario" : /código/.test(acao) ? "codigo" : /orçamento/.test(acao) ? "pdf" : "baixar");

  const TELAS = {
    inicio() {
      const ativos = estado.clientes.filter((c) => c.ativo).length;
      const andamento = estado.projetos.filter((p) => p.status !== "entregue").length;
      const entregues = estado.projetos.filter((p) => p.status === "entregue").length;
      const novos = estado.contatos.filter((c) => !c.lido).length;
      const kpi = (icone, n, rotulo) => `<div class="kpi">${ico(icone)}<div><strong>${n}</strong><span>${rotulo}</span></div></div>`;
      const semAcesso = estado.clientes.filter((c) => c.ativo && !estado.usuarios.some((u) => u.clienteId === c.id));
      return `
        ${topo(`Olá, ${esc(estado.eu.nome.split(" ")[0])}`, "Resumo da NEX Tecnologias: clientes, projetos e o que acontece no portal.", `<a class="btn btn--primary btn--sm" href="#/clientes" data-novo-cliente>${ico("mais")} Novo cliente</a>`)}
        <div class="kpis">
          ${kpi("predio", ativos, "clientes ativos")}
          ${kpi("camadas", andamento, "projetos em andamento")}
          ${kpi("foguete", entregues, "projetos entregues")}
          ${kpi("mensagem", novos, "contatos novos do site")}
        </div>
        ${semAcesso.length ? `
          <div class="cartao" style="border-left:4px solid #F59E0B;margin-bottom:20px">
            <div class="cartao__topo"><h3>Clientes sem acesso ao portal</h3></div>
            <p class="small muted" style="margin-bottom:12px">Crie o login para o cliente acompanhar o projeto.</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap">${semAcesso.map((c) => `<button class="btn btn--soft btn--xs" data-novo-acesso="${esc(c.id)}">${ico("mais")} Acesso para ${esc(c.nome)}</button>`).join("")}</div>
          </div>` : ""}
        <div class="grade-2">
          <div class="cartao">
            <div class="cartao__topo"><h3>Projetos</h3><a class="link small" href="#/projetos">Ver todos</a></div>
            ${estado.projetos.length ? `<ul class="feed">${estado.projetos.slice(0, 6).map((p) => `
              <li class="clicavel" data-abrir-projeto="${esc(p.id)}" style="cursor:pointer;align-items:center">${ico("camadas")}
                <div style="flex:1"><b>${esc(p.nome)}</b><small>${esc(nomeCliente(p.clienteId))}</small></div>${statusTag(p.status)}
              </li>`).join("")}</ul>` : '<p class="muted small">Nenhum projeto ainda.</p>'}
          </div>
          <div class="cartao">
            <div class="cartao__topo"><h3>Atividade dos clientes</h3><a class="link small" href="#/atividade">Ver tudo</a></div>
            ${estado.registros.length ? `<ul class="feed">${estado.registros.slice(0, 7).map((r) => `
              <li>${ico(iconeRegistro(r.acao))}<div>${textoRegistro(r)}<small>${esc(r.clienteNome || "")} · ${esc(NEX.relativo(r.criadoEm))}</small></div></li>`).join("")}</ul>` : '<p class="muted small">Quando os clientes entrarem no portal ou baixarem arquivos, aparece aqui.</p>'}
          </div>
        </div>`;
    },

    clientes() {
      const linhas = estado.clientes.map((c) => {
        const projetos = estado.projetos.filter((p) => p.clienteId === c.id).length;
        const acessos = estado.usuarios.filter((u) => u.clienteId === c.id).length;
        return `
          <tr>
            <td><b>${esc(c.nome)}</b><small>${esc(c.razaoSocial || c.documento || "")}</small></td>
            <td>${esc(c.contatoNome || "—")}<small>${esc([c.email, c.telefone].filter(Boolean).join(" · "))}</small></td>
            <td>${projetos}</td>
            <td>${acessos || '<span class="status status--proposta">Sem acesso</span>'}</td>
            <td>${c.ativo ? '<span class="status status--entregue">Ativo</span>' : '<span class="status status--off">Inativo</span>'}</td>
            <td><div class="acoes">
              <a class="icobtn" href="${portalDe(c.id)}" title="Ver o portal deste cliente">${ico("olho")}</a>
              <button class="icobtn" data-novo-acesso="${esc(c.id)}" title="Criar acesso ao portal">${ico("chave")}</button>
              <button class="icobtn" data-editar-cliente="${esc(c.id)}" title="Editar">${ico("editar")}</button>
              <button class="icobtn icobtn--danger" data-excluir-cliente="${esc(c.id)}" title="Excluir">${ico("lixo")}</button>
            </div></td>
          </tr>`;
      });
      return `
        ${topo("Clientes", "Empresas e instituições atendidas pela NEX.", `<button class="btn btn--primary btn--sm" data-novo-cliente>${ico("mais")} Novo cliente</button>`)}
        ${linhas.length ? `<div class="tabela-wrap"><table class="tabela">
          <thead><tr><th>Cliente</th><th>Contato</th><th>Projetos</th><th>Acessos</th><th>Situação</th><th></th></tr></thead>
          <tbody>${linhas.join("")}</tbody></table></div>` : vazio("predio", "Nenhum cliente", "Cadastre o primeiro cliente para começar.")}`;
    },

    projetos() {
      const contagem = (p) => TIPOS_ARQUIVO.map((t) => [t, p.arquivos.filter((a) => a.tipo === t.id).length]).filter(([, n]) => n).map(([t, n]) => `${n} ${t.rotulo.toLowerCase()}`).join(" · ");
      const linhas = estado.projetos.map((p) => `
        <tr class="clicavel" data-abrir-projeto="${esc(p.id)}">
          <td><b>${esc(p.nome)}</b><small>${esc(p.subtitulo)}</small></td>
          <td>${esc(nomeCliente(p.clienteId))}</td>
          <td>${statusTag(p.status)}</td>
          <td><small>${contagem(p) || "Nenhum arquivo"}</small></td>
          <td>${p.visivel ? "Sim" : '<span class="status status--off">Oculto</span>'}</td>
          <td><div class="acoes"><a class="icobtn" href="${portalDe(p.clienteId, p.id)}" title="Ver como o cliente">${ico("olho")}</a><span class="icobtn">${ico("direita")}</span></div></td>
        </tr>`);
      return `
        ${topo("Projetos", "Sistemas vendidos e entregues: o que cada cliente vê no portal.", estado.clientes.length ? `<a class="btn btn--primary btn--sm" href="#/projeto/novo">${ico("mais")} Novo projeto</a>` : "")}
        ${linhas.length ? `<div class="tabela-wrap"><table class="tabela">
          <thead><tr><th>Projeto</th><th>Cliente</th><th>Situação</th><th>Arquivos</th><th>Visível</th><th></th></tr></thead>
          <tbody>${linhas.join("")}</tbody></table></div>` : vazio("camadas", "Nenhum projeto", estado.clientes.length ? "Crie o primeiro projeto." : "Cadastre um cliente antes de criar projetos.")}`;
    },

    projeto(id) {
      const novo = id === "novo";
      const p = novo
        ? { clienteId: new URLSearchParams(location.hash.split("?")[1]).get("cliente") || estado.clientes[0]?.id, nome: "", subtitulo: "", descricao: "", status: "proposta", urlAcesso: "", urlCodigo: "", acessoUsuario: "", acessoSenha: "", destaques: [], informacoes: [], tecnologias: [], inicio: null, entrega: null, visivel: true, arquivos: [] }
        : estado.projetos.find((x) => x.id === id);
      if (!p) return vazio("info", "Projeto não encontrado", '<a class="link" href="#/projetos">Voltar aos projetos</a>');

      const grupos = new Map();
      for (const t of p.tecnologias) grupos.set(t.categoria, [...(grupos.get(t.categoria) || []), t.nome]);
      const tecnologiasTexto = [...grupos].map(([c, n]) => `${c}: ${n.join(", ")}`).join("\n");

      return `
        ${topo(novo ? "Novo projeto" : esc(p.nome), novo ? "Preencha os dados e salve para liberar o envio de arquivos." : `${esc(nomeCliente(p.clienteId))} · atualizado ${esc(NEX.relativo(p.atualizadoEm))}`,
          novo ? "" : `<a class="btn btn--outline btn--sm" href="${portalDe(p.clienteId, p.id)}" target="_blank" rel="noopener">${ico("olho")} Ver como o cliente</a>
                       <button class="btn btn--danger btn--sm" data-excluir-projeto="${esc(p.id)}">${ico("lixo")} Excluir</button>`,
          `<a class="voltar" href="#/projetos">${ico("seta")}Projetos</a>`)}
        <div class="editor">
          <form class="editor__col" id="form-projeto" novalidate>
            <div class="cartao form-grid">
              <h3>Dados do projeto</h3>
              <div class="campos-2">
                <label class="field"><span>Cliente *</span><select name="clienteId">${opcoesClientes(p.clienteId)}</select></label>
                <label class="field"><span>Situação</span><select name="status">${NEX.STATUS.map((s) => `<option value="${s.id}"${s.id === p.status ? " selected" : ""}>${s.rotulo}</option>`).join("")}</select></label>
              </div>
              <label class="field"><span>Nome do sistema *</span><input name="nome" value="${esc(p.nome)}" placeholder="Ex.: Jornada SAVA"></label>
              <label class="field"><span>Subtítulo</span><input name="subtitulo" value="${esc(p.subtitulo)}" placeholder="Uma frase sobre o que o sistema faz"></label>
              <div class="campos-2">
                <label class="field"><span>Link de acesso ao sistema</span><input name="urlAcesso" value="${esc(p.urlAcesso)}" placeholder="https://sistema.cliente.com.br"></label>
                <label class="field"><span>Repositório do código <small>(opcional)</small></span><input name="urlCodigo" value="${esc(p.urlCodigo)}" placeholder="https://github.com/…"></label>
              </div>
              <div class="campos-2">
                <label class="field"><span>Início</span><input type="date" name="inicio" value="${esc(p.inicio || "")}"></label>
                <label class="field"><span>Entrega</span><input type="date" name="entrega" value="${esc(p.entrega || "")}"></label>
              </div>
              <label class="alternar"><input type="checkbox" name="visivel"${p.visivel ? " checked" : ""}> Visível para o cliente no portal</label>
            </div>
            <div class="cartao form-grid">
              <h3>Acesso administrativo do sistema</h3>
              <p class="small muted" style="margin-top:-6px">Login de administrador do sistema entregue. Aparece para o cliente na Visão geral, com a senha oculta até ele clicar.</p>
              <div class="campos-2">
                <label class="field"><span>Usuário / e-mail</span><input name="acessoUsuario" value="${esc(p.acessoUsuario || "")}" autocomplete="off"></label>
                <label class="field"><span>Senha</span><input name="acessoSenha" value="${esc(p.acessoSenha || "")}" autocomplete="off"></label>
              </div>
            </div>
            <div class="cartao form-grid">
              <h3>Conteúdo do portal</h3>
              <label class="field"><span>Descrição <small>(linha em branco separa parágrafos)</small></span><textarea name="descricao" rows="7">${esc(p.descricao)}</textarea></label>
              <label class="field"><span>O que o sistema entrega <small>(uma funcionalidade por linha)</small></span><textarea name="destaques" rows="6">${esc(p.destaques.join("\n"))}</textarea></label>
              <label class="field"><span>Informações <small>(uma por linha, no formato Rótulo: valor)</small></span><textarea class="mono" name="informacoes" rows="5" placeholder="Hospedagem: VPS Linux">${esc(p.informacoes.map((i) => `${i.rotulo}: ${i.valor}`).join("\n"))}</textarea></label>
              <label class="field"><span>Tecnologias e ferramentas <small>(uma categoria por linha: Categoria: item, item)</small></span><textarea class="mono" name="tecnologias" rows="6" placeholder="Back-end: Node.js, Express">${esc(tecnologiasTexto)}</textarea></label>
              <div style="display:flex;justify-content:flex-end"><button type="submit" class="btn btn--primary">${ico("check")} ${novo ? "Criar projeto" : "Salvar alterações"}</button></div>
            </div>
          </form>
          <div class="editor__col" id="col-arquivos">${colunaArquivos(p, novo)}</div>
        </div>`;
    },

    acessos() {
      const linhas = estado.usuarios.map((u) => {
        const situacao = !u.ativo ? '<span class="status status--off">Inativo</span>'
          : u.trocarSenha ? '<span class="status status--proposta">Aguardando 1º acesso</span>'
          : '<span class="status status--entregue">Ativo</span>';
        return `
          <tr>
            <td><b>${esc(u.nome)}</b><small>${esc(u.email)}</small></td>
            <td>${u.perfil === "admin" ? '<span class="status status--aprovado">Equipe NEX</span>' : esc(nomeCliente(u.clienteId))}</td>
            <td>${esc(NEX.relativo(u.ultimoAcesso))}<small>${esc(NEX.dataHora(u.ultimoAcesso))}</small></td>
            <td>${situacao}</td>
            <td><div class="acoes">
              <button class="icobtn" data-nova-senha="${esc(u.id)}" title="Gerar nova senha provisória">${ico("chave")}</button>
              <button class="icobtn" data-editar-usuario="${esc(u.id)}" title="Editar">${ico("editar")}</button>
              ${u.id === estado.eu.id ? "" : `<button class="icobtn icobtn--danger" data-excluir-usuario="${esc(u.id)}" title="Excluir">${ico("lixo")}</button>`}
            </div></td>
          </tr>`;
      });
      return `
        ${topo("Acessos", "Quem entra no portal (clientes) e no painel (equipe NEX).", `<button class="btn btn--primary btn--sm" data-novo-acesso>${ico("mais")} Novo acesso</button>`)}
        <div class="tabela-wrap"><table class="tabela">
          <thead><tr><th>Pessoa</th><th>Cliente / perfil</th><th>Último acesso</th><th>Situação</th><th></th></tr></thead>
          <tbody>${linhas.join("")}</tbody></table></div>`;
    },

    contatos() {
      const whats = (tel) => {
        const n = String(tel || "").replace(/\D/g, "");
        return n.length >= 10 ? `https://wa.me/${n.length <= 11 ? `55${n}` : n}` : "";
      };
      const itens = estado.contatos.map((c) => `
        <div class="cartao contato-item${c.lido ? "" : " is-novo"}">
          <div class="contato-item__topo">
            <div><b style="color:var(--navy-900);font-size:16px">${esc(c.nome)}</b>${c.lido ? "" : ' <span class="selo" style="background:#FEF3C7;color:#92400E">Novo</span>'}
              <div class="small muted">${esc(c.instituicao || "")}${c.cidade ? ` · ${esc(c.cidade)}` : ""}</div></div>
            <span class="small muted">${esc(NEX.dataHora(c.criadoEm))}</span>
          </div>
          <div class="contato-item__dados">
            <span>${esc(c.email)}</span>${c.telefone ? `<span>${esc(c.telefone)}</span>` : ""}
            ${c.segmento ? `<span>Segmento: ${esc(c.segmento)}</span>` : ""}${c.interesse ? `<span>Interesse: ${esc(c.interesse)}</span>` : ""}
          </div>
          ${c.mensagem ? `<div class="contato-item__msg">${esc(c.mensagem)}</div>` : ""}
          <div class="contato-item__acoes">
            <a class="btn btn--soft btn--xs" href="mailto:${esc(c.email)}">${ico("email")} Responder</a>
            ${whats(c.telefone) ? `<a class="btn btn--soft btn--xs" href="${whats(c.telefone)}" target="_blank" rel="noopener">${ico("whats")} WhatsApp</a>` : ""}
            <button class="btn btn--outline btn--xs" data-virar-cliente="${esc(c.id)}">${ico("predio")} Cadastrar como cliente</button>
            <button class="btn btn--outline btn--xs" data-lido="${esc(c.id)}">${ico("check")} ${c.lido ? "Marcar como novo" : "Marcar como lido"}</button>
            <button class="btn btn--danger btn--xs" data-excluir-contato="${esc(c.id)}">${ico("lixo")}</button>
          </div>
        </div>`);
      return `
        ${topo("Contatos do site", "Mensagens enviadas pelo formulário de nextecnologias.com.br.")}
        ${itens.length ? `<div style="display:grid;gap:16px">${itens.join("")}</div>` : vazio("mensagem", "Nenhuma mensagem ainda", "Quando alguém preencher o formulário do site, aparece aqui.")}`;
    },

    atividade() {
      return `
        ${topo("Atividade", "Entradas no portal e downloads feitos pelos clientes (últimos 200 registros).")}
        ${estado.registros.length ? `<div class="tabela-wrap"><table class="tabela">
          <thead><tr><th>Quando</th><th>Cliente</th><th>O que aconteceu</th></tr></thead>
          <tbody>${estado.registros.map((r) => `<tr><td class="nowrap">${esc(NEX.dataHora(r.criadoEm))}</td><td>${esc(r.clienteNome || "—")}</td><td>${textoRegistro(r)}</td></tr>`).join("")}</tbody>
        </table></div>` : vazio("atividade", "Sem atividade", "Ainda nenhum cliente entrou no portal.")}`;
    },
  };

  // ---------- Arquivos ----------
  const colunaArquivos = (p, novo) => `
    <div class="cartao">
      <div class="cartao__topo"><h3>Arquivos do projeto</h3></div>
      ${novo ? '<div class="envio__vazio">Salve o projeto para enviar orçamento, telas e código-fonte.</div>' : TIPOS_ARQUIVO.map((t) => blocoEnvio(p, t)).join("")}
      ${novo ? "" : '<p class="small muted" style="margin-top:18px">Os arquivos só são entregues a quem tem acesso a este cliente. Downloads de orçamento e código ficam registrados em Atividade.</p>'}
    </div>`;

  // Atualiza só a coluna de arquivos, sem perder o que estiver sendo digitado no formulário ao lado.
  async function recarregarArquivos() {
    await carregar();
    const p = estado.projetos.find((x) => x.id === rota().id);
    const col = $("#col-arquivos");
    if (p && col) col.innerHTML = colunaArquivos(p, false);
    else desenhar();
  }

  function blocoEnvio(p, t) {
    const lista = p.arquivos.filter((a) => a.tipo === t.id);
    const item = (a, i) => `
      <div class="envio__item" data-arquivo="${esc(a.id)}">
        ${a.mime.startsWith("image/") ? `<img src="/api/arquivos/${esc(a.id)}" alt="" loading="lazy">` : `<span class="arquivo__ico ${t.id === "orcamento" ? "arquivo__ico--pdf" : t.id === "codigo" ? "arquivo__ico--zip" : ""}">${ico(t.icone)}</span>`}
        <div>
          <input data-campo="titulo" value="${esc(a.titulo)}" aria-label="Título" placeholder="Título">
          ${t.id === "imagem" ? `<input class="legenda" data-campo="legenda" value="${esc(a.legenda)}" aria-label="Legenda" placeholder="Legenda (opcional)">` : ""}
          <small>${esc(a.nome)} · ${NEX.tamanho(a.tamanho)} · ${esc(NEX.data(a.criadoEm))}</small>
        </div>
        <div class="acoes">
          ${t.id === "imagem" && lista.length > 1 ? `<button type="button" class="icobtn" data-mover="-1" title="Subir"${i === 0 ? " disabled" : ""}>${ico("cima")}</button><button type="button" class="icobtn" data-mover="1" title="Descer"${i === lista.length - 1 ? " disabled" : ""}>${ico("baixo")}</button>` : ""}
          <a class="icobtn" href="/api/arquivos/${esc(a.id)}" target="_blank" rel="noopener" title="Abrir">${ico("olho")}</a>
          <button type="button" class="icobtn icobtn--danger" data-excluir-arquivo title="Excluir">${ico("lixo")}</button>
        </div>
      </div>`;
    return `
      <div class="envio" data-tipo="${t.id}">
        <div class="envio__topo">
          <h3>${ico(t.icone)} ${t.rotulo} <small>${t.dica}</small></h3>
          <label class="btn btn--soft btn--xs">${ico("enviar")} Enviar
            <input type="file" class="sr" accept="${t.aceita}"${t.multiplo ? " multiple" : ""} data-enviar="${t.id}">
          </label>
        </div>
        <div class="progresso" hidden><i></i></div>
        <div class="envio__lista">${lista.length ? lista.map(item).join("") : `<div class="envio__vazio">Nenhum arquivo enviado.</div>`}</div>
      </div>`;
  }

  async function enviarArquivos(projetoId, tipo, arquivos, bloco) {
    const barra = $(".progresso", bloco);
    barra.hidden = false;
    let enviados = 0;
    for (const arquivo of arquivos) {
      const url = `/api/admin/projetos/${encodeURIComponent(projetoId)}/arquivos?tipo=${tipo}&nome=${encodeURIComponent(arquivo.name)}`;
      try {
        await NEX.enviarArquivo(url, arquivo, (f) => ($("i", barra).style.width = `${((enviados + f) / arquivos.length) * 100}%`));
        enviados += 1;
      } catch (err) {
        NEX.aviso(`${arquivo.name}: ${err.message}`, "erro");
      }
    }
    if (enviados) NEX.aviso(enviados > 1 ? `${enviados} arquivos enviados.` : "Arquivo enviado.");
    await recarregarArquivos();
  }

  // ---------- Formulários ----------
  function formCliente(c = {}) {
    dialogo({
      titulo: c.id ? "Editar cliente" : "Novo cliente",
      largo: true,
      corpo: `
        <div class="campos-2">
          <label class="field"><span>Nome de exibição *</span><input name="nome" value="${esc(c.nome || "")}" placeholder="Como aparece no portal"></label>
          <label class="field"><span>Razão social</span><input name="razaoSocial" value="${esc(c.razaoSocial || "")}"></label>
        </div>
        <div class="campos-2">
          <label class="field"><span>CNPJ / CPF</span><input name="documento" value="${esc(c.documento || "")}"></label>
          <label class="field"><span>Cidade / UF</span><input name="cidade" value="${esc(c.cidade || "")}"></label>
        </div>
        <div class="campos-2">
          <label class="field"><span>Responsável</span><input name="contatoNome" value="${esc(c.contatoNome || "")}"></label>
          <label class="field"><span>Telefone / WhatsApp</span><input name="telefone" value="${esc(c.telefone || "")}"></label>
        </div>
        <label class="field"><span>E-mail</span><input type="email" name="email" value="${esc(c.email || "")}"></label>
        <label class="field"><span>Observações internas <small>(o cliente não vê)</small></span><textarea name="observacoes" rows="3">${esc(c.observacoes || "")}</textarea></label>
        <label class="alternar"><input type="checkbox" name="ativo"${c.ativo === false ? "" : " checked"}> Cliente ativo (com acesso ao portal)</label>`,
      aoEnviar: async (f, dlg) => {
        const corpo = {
          nome: f.nome.value, razaoSocial: f.razaoSocial.value, documento: f.documento.value, cidade: f.cidade.value,
          contatoNome: f.contatoNome.value, telefone: f.telefone.value, email: f.email.value, observacoes: f.observacoes.value, ativo: f.ativo.checked,
        };
        const r = c.id ? await NEX.api("PUT", `/api/admin/clientes/${encodeURIComponent(c.id)}`, corpo) : await NEX.api("POST", "/api/admin/clientes", corpo);
        dlg.close();
        NEX.aviso(c.id ? "Cliente atualizado." : "Cliente cadastrado.");
        await recarregar();
        if (!c.id && (await confirmar("Criar o projeto agora?", `Cliente <b>${esc(corpo.nome)}</b> cadastrado. Quer criar o projeto dele em seguida?`, "Criar projeto"))) {
          location.hash = `#/projeto/novo?cliente=${encodeURIComponent(r.id)}`;
        }
      },
    });
  }

  function formNovoAcesso(clienteId = "") {
    const dlg = dialogo({
      titulo: "Novo acesso",
      corpo: `
        <div class="campos-2">
          <label class="field"><span>Tipo</span><select name="perfil"><option value="cliente">Cliente (portal)</option><option value="admin">Equipe NEX (painel)</option></select></label>
          <label class="field" data-so-cliente><span>Cliente *</span><select name="clienteId"><option value="">Selecione</option>${opcoesClientes(clienteId)}</select></label>
        </div>
        <label class="field"><span>Nome *</span><input name="nome" placeholder="Nome da pessoa"></label>
        <label class="field"><span>E-mail *</span><input type="email" name="email" placeholder="usado para entrar"></label>
        <label class="field"><span>Senha provisória <small>(deixe em branco para gerar uma)</small></span><input name="senha" autocomplete="off"></label>`,
      botao: "Criar acesso",
      aoEnviar: async (f, d) => {
        const corpo = { perfil: f.perfil.value, clienteId: f.clienteId.value, nome: f.nome.value, email: f.email.value, senha: f.senha.value };
        const { senha } = await NEX.api("POST", "/api/admin/usuarios", corpo);
        d.close();
        await recarregar();
        mostrarCredencial({ ...corpo, email: corpo.email.trim().toLowerCase(), clienteId: corpo.perfil === "cliente" ? corpo.clienteId : null }, senha);
      },
    });
    const f = $("form", dlg);
    const sincronizar = () => ($("[data-so-cliente]", dlg).hidden = f.perfil.value !== "cliente");
    f.perfil.addEventListener("change", sincronizar);
    if (clienteId) {
      const c = clientePorId(clienteId);
      if (c?.contatoNome) f.nome.value = c.contatoNome;
      if (c?.email) f.email.value = c.email;
    }
  }

  function formUsuario(u) {
    dialogo({
      titulo: "Editar acesso",
      corpo: `
        <label class="field"><span>Nome *</span><input name="nome" value="${esc(u.nome)}"></label>
        <label class="field"><span>E-mail *</span><input type="email" name="email" value="${esc(u.email)}"></label>
        <label class="alternar"><input type="checkbox" name="ativo"${u.ativo ? " checked" : ""}> Acesso ativo</label>`,
      aoEnviar: async (f, d) => {
        await NEX.api("PUT", `/api/admin/usuarios/${encodeURIComponent(u.id)}`, { nome: f.nome.value, email: f.email.value, ativo: f.ativo.checked });
        d.close();
        NEX.aviso("Acesso atualizado.");
        await recarregar();
      },
    });
  }

  function formMinhaSenha() {
    dialogo({
      titulo: "Alterar minha senha",
      corpo: `
        <label class="field"><span>Nova senha</span><input type="password" name="senha" autocomplete="new-password" placeholder="Pelo menos 8 caracteres"></label>
        <label class="field"><span>Confirme</span><input type="password" name="confirma" autocomplete="new-password"></label>`,
      aoEnviar: async (f, d) => {
        if (f.senha.value !== f.confirma.value) throw new Error("As senhas não conferem.");
        await NEX.api("POST", "/api/minha-senha", { senha: f.senha.value });
        d.close();
        NEX.aviso("Senha alterada.");
      },
    });
  }

  // "Rótulo: valor" por linha / "Categoria: a, b" por linha.
  const linhas = (t) => t.split("\n").map((l) => l.trim()).filter(Boolean);
  const dividir = (l) => {
    const i = l.indexOf(":");
    return i < 0 ? ["", l] : [l.slice(0, i).trim(), l.slice(i + 1).trim()];
  };

  async function salvarProjeto(form, id) {
    const corpo = {
      clienteId: form.clienteId.value,
      status: form.status.value,
      nome: form.nome.value,
      subtitulo: form.subtitulo.value,
      urlAcesso: form.urlAcesso.value,
      urlCodigo: form.urlCodigo.value,
      acessoUsuario: form.acessoUsuario.value,
      acessoSenha: form.acessoSenha.value,
      inicio: form.inicio.value,
      entrega: form.entrega.value,
      visivel: form.visivel.checked,
      descricao: form.descricao.value,
      destaques: linhas(form.destaques.value),
      informacoes: linhas(form.informacoes.value).map(dividir).filter(([r]) => r).map(([rotulo, valor]) => ({ rotulo, valor })),
      tecnologias: linhas(form.tecnologias.value).flatMap((l) => {
        const [categoria, itens] = dividir(l);
        return itens.split(",").map((nome) => ({ categoria: categoria || "Outros", nome: nome.trim() })).filter((t) => t.nome);
      }),
    };
    const botao = $("[type=submit]", form);
    botao.disabled = true;
    try {
      if (id === "novo") {
        const r = await NEX.api("POST", "/api/admin/projetos", corpo);
        NEX.aviso("Projeto criado. Agora envie os arquivos.");
        await carregar();
        location.hash = `#/projeto/${r.id}`;
      } else {
        await NEX.api("PUT", `/api/admin/projetos/${encodeURIComponent(id)}`, corpo);
        NEX.aviso("Projeto salvo.");
        await recarregar();
      }
    } catch (err) {
      NEX.aviso(err.message, "erro");
    } finally {
      botao.disabled = false;
    }
  }

  // ---------- Eventos ----------
  const acao = (fn) => (...args) => Promise.resolve(fn(...args)).catch((err) => NEX.aviso(err.message, "erro"));

  main.addEventListener("click", acao(async (ev) => {
    const el = ev.target.closest("[data-novo-cliente],[data-editar-cliente],[data-excluir-cliente],[data-novo-acesso],[data-editar-usuario],[data-nova-senha],[data-excluir-usuario],[data-abrir-projeto],[data-excluir-projeto],[data-excluir-arquivo],[data-mover],[data-lido],[data-excluir-contato],[data-virar-cliente]");
    if (!el || ev.target.closest("a[href]:not([data-novo-cliente])")) return;
    const d = el.dataset;
    if ("novoCliente" in d) {
      ev.preventDefault();
      return formCliente();
    }
    if (d.editarCliente) return formCliente(clientePorId(d.editarCliente));
    if (d.excluirCliente) {
      const c = clientePorId(d.excluirCliente);
      if (!(await confirmar("Excluir cliente", `Excluir <b>${esc(c.nome)}</b>? Os projetos, arquivos e acessos dele também serão apagados. Isso não pode ser desfeito.`))) return;
      await NEX.api("DELETE", `/api/admin/clientes/${encodeURIComponent(c.id)}`);
      NEX.aviso("Cliente excluído.");
      return recarregar();
    }
    if ("novoAcesso" in d) return formNovoAcesso(d.novoAcesso);
    if (d.editarUsuario) return formUsuario(estado.usuarios.find((u) => u.id === d.editarUsuario));
    if (d.novaSenha) {
      const u = estado.usuarios.find((x) => x.id === d.novaSenha);
      if (!(await confirmar("Gerar nova senha", `Gerar uma senha provisória para <b>${esc(u.nome)}</b>? A senha atual deixa de funcionar.`, "Gerar senha"))) return;
      const { senha } = await NEX.api("POST", `/api/admin/usuarios/${encodeURIComponent(u.id)}/nova-senha`);
      await recarregar();
      return mostrarCredencial(u, senha, "Nova senha gerada");
    }
    if (d.excluirUsuario) {
      const u = estado.usuarios.find((x) => x.id === d.excluirUsuario);
      if (!(await confirmar("Excluir acesso", `Excluir o acesso de <b>${esc(u.nome)}</b> (${esc(u.email)})?`))) return;
      await NEX.api("DELETE", `/api/admin/usuarios/${encodeURIComponent(u.id)}`);
      NEX.aviso("Acesso excluído.");
      return recarregar();
    }
    if (d.abrirProjeto) return void (location.hash = `#/projeto/${d.abrirProjeto}`);
    if (d.excluirProjeto) {
      const p = estado.projetos.find((x) => x.id === d.excluirProjeto);
      if (!(await confirmar("Excluir projeto", `Excluir <b>${esc(p.nome)}</b> e todos os arquivos enviados? Isso não pode ser desfeito.`))) return;
      await NEX.api("DELETE", `/api/admin/projetos/${encodeURIComponent(p.id)}`);
      NEX.aviso("Projeto excluído.");
      await carregar();
      return void (location.hash = "#/projetos");
    }
    if ("excluirArquivo" in d) {
      const id = el.closest("[data-arquivo]").dataset.arquivo;
      if (!(await confirmar("Excluir arquivo", "Excluir este arquivo? O cliente deixa de vê-lo no portal."))) return;
      await NEX.api("DELETE", `/api/admin/arquivos/${encodeURIComponent(id)}`);
      NEX.aviso("Arquivo excluído.");
      return recarregarArquivos();
    }
    if (d.mover) {
      const lista = $$("[data-arquivo]", el.closest(".envio__lista")).map((x) => x.dataset.arquivo);
      const i = lista.indexOf(el.closest("[data-arquivo]").dataset.arquivo);
      const j = i + Number(d.mover);
      [lista[i], lista[j]] = [lista[j], lista[i]];
      await NEX.api("PUT", `/api/admin/projetos/${encodeURIComponent(rota().id)}/ordem`, { ids: lista });
      return recarregarArquivos();
    }
    if (d.lido) {
      const c = estado.contatos.find((x) => x.id === d.lido);
      await NEX.api("PUT", `/api/admin/contatos/${encodeURIComponent(c.id)}`, { lido: !c.lido });
      return recarregar();
    }
    if (d.excluirContato) {
      if (!(await confirmar("Excluir mensagem", "Excluir esta mensagem do formulário de contato?"))) return;
      await NEX.api("DELETE", `/api/admin/contatos/${encodeURIComponent(d.excluirContato)}`);
      return recarregar();
    }
    if (d.virarCliente) {
      const c = estado.contatos.find((x) => x.id === d.virarCliente);
      if (!c.lido) NEX.api("PUT", `/api/admin/contatos/${encodeURIComponent(c.id)}`, { lido: true }).then(carregar).catch(() => {});
      return formCliente({ nome: c.instituicao || c.nome, contatoNome: c.nome, email: c.email, telefone: c.telefone, cidade: c.cidade, observacoes: c.mensagem ? `Mensagem pelo site: ${c.mensagem}` : "" });
    }
  }));

  // Título e legenda dos arquivos: salvam ao sair do campo.
  main.addEventListener("change", acao(async (ev) => {
    const entrada = ev.target.closest("[data-enviar]");
    if (entrada) {
      const arquivos = [...entrada.files];
      entrada.value = "";
      if (arquivos.length) await enviarArquivos(rota().id, entrada.dataset.enviar, arquivos, entrada.closest(".envio"));
      return;
    }
    const campo = ev.target.closest("[data-arquivo] input[data-campo]");
    if (campo) {
      const item = campo.closest("[data-arquivo]");
      await NEX.api("PUT", `/api/admin/arquivos/${encodeURIComponent(item.dataset.arquivo)}`, {
        titulo: $('[data-campo="titulo"]', item).value,
        legenda: $('[data-campo="legenda"]', item)?.value || "",
      });
      await carregar();
      NEX.aviso("Arquivo atualizado.");
    }
  }));

  main.addEventListener("submit", (ev) => {
    if (ev.target.id !== "form-projeto") return;
    ev.preventDefault();
    salvarProjeto(ev.target, rota().id);
  });

  $("#sair").addEventListener("click", NEX.sair);
  $("#minha-senha").addEventListener("click", formMinhaSenha);

  // ---------- Rotas (#/clientes, #/projeto/ID…) ----------
  function rota() {
    const [caminho] = location.hash.slice(1).split("?");
    const [, secao = "", id = ""] = caminho.split("/");
    return { secao: secao || "inicio", id: decodeURIComponent(id) };
  }

  function desenhar() {
    if (!estado) return; // ainda carregando: carregar() desenha ao terminar
    const { secao, id } = rota();
    const tela = TELAS[secao] ? secao : "inicio";
    const ativa = tela === "projeto" ? "projetos" : tela;
    $$("#nav a").forEach((a) => a.classList.toggle("is-ativo", a.dataset.secao === ativa));
    main.innerHTML = TELAS[tela](id);
    document.title = `${$("#nav a.is-ativo .rot")?.textContent || "Painel"} | NEX Tecnologias`;
  }

  window.addEventListener("hashchange", () => {
    desenhar();
    window.scrollTo(0, 0);
  });

  carregar()
    .then(() => {
      if (estado.eu.trocarSenha) return location.replace("/entrar");
      desenhar();
    })
    .catch((err) => (main.innerHTML = vazio("info", "Não foi possível carregar o painel", esc(err.message))));
})();
