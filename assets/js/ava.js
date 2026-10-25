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

  /* ---------- Hero: a tela acompanha o mouse ---------- */
  const hx = $("#hx");
  if (matchMedia("(hover: hover) and (min-width: 1081px)").matches && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    hx.addEventListener("pointermove", (e) => {
      const r = hx.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      hx.style.setProperty("--ry", `${-7 + x * 10}deg`);
      hx.style.setProperty("--rx", `${3 - y * 8}deg`);
    });
    hx.addEventListener("pointerleave", () => {
      hx.style.removeProperty("--ry");
      hx.style.removeProperty("--rx");
    });
  }

  /* ---------- Módulos: carrossel em loop dentro de cada classe ---------- */
  const car = $("#car");
  const palco = $("#car-track");
  const slides = $$(".slide", palco);
  const classes = $$(".car__cats button", car);
  const caixaPontos = $("#car-dots");
  const TEMPO_SLIDE = 5000;
  car.style.setProperty("--dur", `${TEMPO_SLIDE}ms`);
  let grupo = [], pontos = [], atual = 0, carTimer, carVisivel = false, carPausado = false;
  const ajustarAltura = () => {
    palco.style.height = `${Math.max(...grupo.map((s) => s.offsetHeight))}px`;
  };
  const posicionarSlides = () => {
    slides.forEach((s) => {
      const i = grupo.indexOf(s);
      let p = "fora";
      if (i >= 0) {
        p = ((i - atual) % grupo.length + grupo.length) % grupo.length;
        if (p > grupo.length / 2) p -= grupo.length;
        if (Math.abs(p) > 1) p = "fora";
      }
      s.dataset.pos = p;
      s.classList.toggle("is-active", p === 0);
      s.setAttribute("aria-hidden", String(p !== 0));
    });
    pontos.forEach((d, k) => d.classList.toggle("is-on", k === atual));
  };
  const reiniciar = () => {
    clearTimeout(carTimer);
    car.classList.remove("is-playing");
    void car.offsetWidth; // recomeça a barrinha do ponto ativo
    if (!carVisivel || carPausado) return;
    car.classList.add("is-playing");
    carTimer = setTimeout(() => { andar(1); reiniciar(); }, TEMPO_SLIDE);
  };
  const andar = (passo) => {
    atual = (atual + passo + grupo.length) % grupo.length;
    posicionarSlides();
  };
  const escolherClasse = (cat) => {
    grupo = slides.filter((s) => s.dataset.cat === cat);
    atual = 0;
    classes.forEach((c) => c.classList.toggle("is-on", c.dataset.cat === cat));
    pontos = grupo.map((s, k) => {
      const d = document.createElement("button");
      d.setAttribute("aria-label", `${s.getAttribute("aria-label")} (${k + 1} de ${grupo.length})`);
      d.addEventListener("click", () => { atual = k; posicionarSlides(); reiniciar(); });
      return d;
    });
    caixaPontos.replaceChildren(...pontos);
    posicionarSlides();
    ajustarAltura();
  };
  classes.forEach((c) => c.addEventListener("click", () => { escolherClasse(c.dataset.cat); reiniciar(); }));
  $("#car-prev").addEventListener("click", () => { andar(-1); reiniciar(); });
  $("#car-next").addEventListener("click", () => { andar(1); reiniciar(); });
  // Clicar no módulo ao lado traz ele para o atual.
  slides.forEach((s) => s.addEventListener("click", () => {
    const p = Number(s.dataset.pos);
    if (p === 1 || p === -1) { andar(p); reiniciar(); }
  }));
  // Arrastar o dedo para os lados no celular.
  let toqueX = null;
  palco.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  palco.addEventListener("touchend", (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    toqueX = null;
    if (Math.abs(dx) > 40) { andar(dx < 0 ? 1 : -1); reiniciar(); }
  });
  car.addEventListener("mouseenter", () => { carPausado = true; reiniciar(); });
  car.addEventListener("mouseleave", () => { carPausado = false; reiniciar(); });
  window.addEventListener("resize", ajustarAltura);
  new IntersectionObserver(([e]) => { carVisivel = e.isIntersecting; reiniciar(); }, { threshold: 0.3 }).observe(car);
  escolherClasse(classes[0].dataset.cat);

  /* ---------- Mapa de acessos por dia e horário (relatórios) ---------- */
  $$("[data-heat]").forEach((mapa) => {
    const dias = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const pesoDia = [0.9, 1, 0.95, 0.85, 0.7, 0.35, 0.25];
    dias.forEach((dia, d) => {
      const rotulo = document.createElement("small");
      rotulo.textContent = dia;
      mapa.append(rotulo);
      for (let h = 0; h < 14; h++) {
        // Picos no fim da manhã e à noite, como em um AVA de formação.
        const curva = Math.max(Math.exp(-((h - 3) ** 2) / 6), Math.exp(-((h - 12) ** 2) / 4));
        const q = document.createElement("i");
        q.style.setProperty("--a", (0.08 + 0.9 * pesoDia[d] * curva).toFixed(2));
        q.style.setProperty("--d", (d * 14 + h) * 8);
        mapa.append(q);
      }
    });
  });

  /* ---------- Código de validação do certificado (desenho de QR) ---------- */
  $$("[data-qr]").forEach((qr) => {
    let semente = 7;
    for (let i = 0; i < 121; i++) {
      const x = i % 11, y = Math.floor(i / 11);
      const canto = (a, b) => x >= a && x < a + 3 && y >= b && y < b + 3;
      semente = (semente * 9301 + 49297) % 233280;
      const q = document.createElement("i");
      if (!(canto(0, 0) || canto(8, 0) || canto(0, 8) || semente / 233280 > 0.5)) q.className = "o";
      qr.append(q);
    }
  });

  /* ---------- Shorts: vitrine em 3D que gira sozinha ---------- */
  const sf = $("#sf");
  const shorts = $$(".sc", sf);
  const TEMPO_SHORT = 4000;
  sf.style.setProperty("--dur", `${TEMPO_SHORT}ms`);
  let centro = 0, sfTimer;
  const posicionar = () => shorts.forEach((c, i) => {
    let p = i - centro;
    if (p > shorts.length / 2) p -= shorts.length;
    if (p < -shorts.length / 2) p += shorts.length;
    c.dataset.pos = p;
  });
  const tocarShorts = () => {
    clearInterval(sfTimer);
    sf.classList.add("is-playing");
    sfTimer = setInterval(() => { centro = (centro + 1) % shorts.length; posicionar(); }, TEMPO_SHORT);
  };
  shorts.forEach((c, i) => c.addEventListener("click", () => { centro = i; posicionar(); tocarShorts(); }));
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting) return tocarShorts();
    clearInterval(sfTimer);
    sf.classList.remove("is-playing");
  }, { threshold: 0.3 }).observe(sf);

  /* ---------- Tecnologia: vídeo com capítulos (arquitetura, armazenamento, mensageria e segurança) ---------- */
  const vp = $("#vp");
  const cenas = $$(".vp__scene", vp);
  const capitulos = $$(".vp__seg", vp);
  const botaoPlay = $("#vp-pp");
  const relogio = $("#vp-time");
  const CENA = 6000, TOTAL = CENA * cenas.length;
  let t = 0, ultimo = 0, rodando = false, vpVisivel = false, cenaAtual = -1;
  const mmss = (ms) => `0:${String(Math.floor(ms / 1000)).padStart(2, "0")}`;
  const desenhar = () => {
    const c = Math.min(Math.floor(t / CENA), cenas.length - 1);
    if (c !== cenaAtual) {
      cenaAtual = c;
      cenas.forEach((s) => s.classList.remove("is-active"));
      void vp.offsetWidth; // recomeça as animações da cena
      cenas[c].classList.add("is-active");
      capitulos.forEach((s, k) => s.classList.toggle("is-active", k === c));
    }
    capitulos.forEach((s, k) => $("i", s).style.setProperty("--f", Math.max(0, Math.min(1, (t - k * CENA) / CENA))));
    relogio.textContent = `${mmss(t)} / ${mmss(TOTAL)}`;
  };
  const quadro = (agora) => {
    if (!rodando) return;
    t = Math.max(0, t + agora - ultimo); // o primeiro quadro pode chegar com horário anterior ao play
    ultimo = agora;
    if (t >= TOTAL) { t = 0; cenaAtual = -1; }
    desenhar();
    requestAnimationFrame(quadro);
  };
  const atualizarVideo = () => {
    const tocar = vpVisivel && !vp.classList.contains("is-paused");
    if (tocar && !rodando) { rodando = true; ultimo = performance.now(); requestAnimationFrame(quadro); }
    if (!tocar) rodando = false;
  };
  botaoPlay.addEventListener("click", () => {
    const pausar = !vp.classList.contains("is-paused");
    vp.classList.toggle("is-paused", pausar);
    botaoPlay.setAttribute("aria-label", pausar ? "Reproduzir" : "Pausar");
    atualizarVideo();
  });
  capitulos.forEach((s, k) => s.addEventListener("click", () => { t = k * CENA; cenaAtual = -1; desenhar(); }));
  new IntersectionObserver(([e]) => { vpVisivel = e.isIntersecting; atualizarVideo(); }, { threshold: 0.4 }).observe(vp);
  desenhar();

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
