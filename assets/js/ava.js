/* =========================================================
   NEX Tecnologias — interações da página do AVA Institucional
   (cabeçalho, menu, reveal, contadores e formulário ficam em main.js)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Barra de progresso da leitura ---------- */
  const barra = $("#av-progress");
  const onScroll = () => {
    const total = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${total > 0 ? scrollY / total : 0})`;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Abas (perfis e módulos) ---------- */
  $$(".av-tabs").forEach((grupo) => {
    const abas = $$('[role="tab"]', grupo);
    const ativar = (aba) => {
      abas.forEach((a) => {
        const on = a === aba;
        a.classList.toggle("is-active", on);
        a.setAttribute("aria-selected", String(on));
        a.tabIndex = on ? 0 : -1;
        const painel = $("#" + a.getAttribute("aria-controls"));
        painel.hidden = !on;
        painel.classList.toggle("is-active", on);
      });
      // Na rolagem horizontal (celular), mantém a aba escolhida à vista.
      aba.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    };
    abas.forEach((a, i) => {
      a.addEventListener("click", () => ativar(a));
      a.addEventListener("keydown", (ev) => {
        const passo = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
        if (!passo) return;
        ev.preventDefault();
        const prox = abas[(i + passo + abas.length) % abas.length];
        prox.focus();
        ativar(prox);
      });
    });
  });

  /* ---------- Cor da instituição na demonstração home + AVA ---------- */
  const duo = $("#duo");
  $$(".duo__swatches button", duo).forEach((b, _, todos) => {
    b.addEventListener("click", () => {
      duo.style.setProperty("--inst", b.dataset.cor);
      todos.forEach((t) => {
        t.classList.toggle("is-on", t === b);
        t.setAttribute("aria-checked", String(t === b));
      });
    });
  });

  /* ---------- Publicação em três passos: avança sozinho enquanto está na tela ---------- */
  const pub = $("#pub");
  const passos = $$(".pub__step", pub);
  const cenas = $$(".pub__scene", pub);
  let atual = 0, timer;
  const mostrar = (n) => {
    atual = n;
    passos.forEach((p, k) => p.classList.toggle("is-active", k === n));
    cenas.forEach((c, k) => c.classList.toggle("is-active", k === n));
  };
  const tocar = () => {
    clearInterval(timer);
    pub.classList.add("is-playing");
    timer = setInterval(() => mostrar((atual + 1) % passos.length), 3600);
  };
  passos.forEach((p, k) => p.addEventListener("click", () => {
    mostrar(k);
    if (pub.classList.contains("is-playing")) tocar();
  }));
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) return tocar();
    clearInterval(timer);
    pub.classList.remove("is-playing");
  }, { threshold: 0.35 }).observe(pub);

  /* ---------- Calculadora de plano ---------- */
  // O controle anda por faixas (não linear) para 500 e 2.000 ficarem em posições legíveis.
  const faixas = [100, 250, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000, Infinity];
  const range = $("#calc-range");
  const saida = $("#calc-out");
  const planos = $$(".plan[data-max]");
  const sobMedida = $("#plano-sob-medida");
  const atualizar = () => {
    const n = faixas[range.value];
    const acima = n > 10000;
    saida.textContent = acima ? "Mais de 10.000 usuários" : `${n.toLocaleString("pt-BR")} usuários`;
    range.style.setProperty("--fill", `${(range.value / range.max) * 100}%`);
    range.setAttribute("aria-valuetext", saida.textContent);
    const rec = acima ? null : planos.find((p) => n <= Number(p.dataset.max));
    planos.forEach((p) => p.classList.toggle("is-rec", p === rec));
    sobMedida.classList.toggle("is-rec", acima);
  };
  range.addEventListener("input", atualizar);
  atualizar();

  /* ---------- Botões de plano preenchem o formulário ---------- */
  const selPlano = $("#form-plano");
  const mensagem = $('#contact-form [name="mensagem"]');
  $$("[data-plano-btn]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const plano = btn.dataset.plano || btn.closest("[data-plano]").dataset.plano;
      const opcao = [...selPlano.options].find((o) => o.value.endsWith(plano));
      if (opcao) selPlano.value = opcao.value;
      if (!mensagem.value.trim()) {
        mensagem.value = plano.includes("Funcionalidade")
          ? "Gostaria de conversar sobre uma funcionalidade específica para a nossa instituição."
          : `Tenho interesse no AVA Institucional (plano ${plano}). Estimamos cerca de ${saida.textContent.toLowerCase()}.`;
      }
    });
  });

  /* ---------- Comparativo dos planos ---------- */
  const toggle = $("#cmpt-toggle");
  const corpo = $("#cmpt-body");
  toggle.addEventListener("click", () => {
    const abrir = corpo.hidden;
    corpo.hidden = !abrir;
    toggle.setAttribute("aria-expanded", String(abrir));
  });
});
