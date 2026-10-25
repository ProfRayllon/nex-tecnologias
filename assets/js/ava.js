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

  /* ---------- Módulos: carrossel que avança sozinho enquanto está na tela ---------- */
  const car = $("#car");
  const trilho = $("#car-track");
  const slides = $$(".slide", trilho);
  const classes = $$(".car__cats button", car);
  const TEMPO_SLIDE = 6000;
  car.style.setProperty("--dur", `${TEMPO_SLIDE}ms`);
  let ativo = -1, carTimer, carVisivel = false, carPausado = false;
  const pontos = [];
  const marcar = (k) => {
    if (k === ativo) return;
    ativo = k;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === k));
    pontos.forEach((d, i) => d.classList.toggle("is-on", i === k));
    classes.forEach((c) => c.classList.toggle("is-on", c.dataset.cat === slides[k].dataset.cat));
  };
  const irPara = (k) => {
    const s = slides[(k + slides.length) % slides.length];
    trilho.scrollTo({ left: s.offsetLeft - (trilho.clientWidth - s.clientWidth) / 2, behavior: "smooth" });
    marcar(slides.indexOf(s));
  };
  const reiniciar = () => {
    clearTimeout(carTimer);
    car.classList.remove("is-playing");
    void car.offsetWidth; // recomeça a barrinha do ponto ativo
    if (!carVisivel || carPausado) return;
    car.classList.add("is-playing");
    carTimer = setTimeout(() => { irPara(ativo + 1); reiniciar(); }, TEMPO_SLIDE);
  };
  slides.forEach((s, k) => {
    const d = document.createElement("button");
    d.setAttribute("aria-label", `${s.getAttribute("aria-label")} (${k + 1} de ${slides.length})`);
    d.addEventListener("click", () => { irPara(k); reiniciar(); });
    $("#car-dots").append(d);
    pontos.push(d);
  });
  $("#car-prev").addEventListener("click", () => { irPara(ativo - 1); reiniciar(); });
  $("#car-next").addEventListener("click", () => { irPara(ativo + 1); reiniciar(); });
  classes.forEach((c) => c.addEventListener("click", () => {
    irPara(slides.findIndex((s) => s.dataset.cat === c.dataset.cat));
    reiniciar();
  }));
  // Arrastar ou rolar à mão também troca o módulo ativo.
  let fimRolagem;
  trilho.addEventListener("scroll", () => {
    clearTimeout(fimRolagem);
    fimRolagem = setTimeout(() => {
      const meio = trilho.scrollLeft + trilho.clientWidth / 2;
      let perto = 0, menor = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(s.offsetLeft + s.clientWidth / 2 - meio);
        if (d < menor) { menor = d; perto = i; }
      });
      if (perto !== ativo) { marcar(perto); reiniciar(); }
    }, 100);
  }, { passive: true });
  car.addEventListener("mouseenter", () => { carPausado = true; reiniciar(); });
  car.addEventListener("mouseleave", () => { carPausado = false; reiniciar(); });
  new IntersectionObserver(([e]) => { carVisivel = e.isIntersecting; reiniciar(); }, { threshold: 0.3 }).observe(car);
  marcar(0);

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

  /* ---------- Fácil de usar: vídeo com capítulos (Envio, Organização, Publicação) ---------- */
  const vp = $("#vp");
  const cenas = $$(".vp__scene", vp);
  const capitulos = $$(".vp__seg", vp);
  const botaoPlay = $("#vp-pp");
  const relogio = $("#vp-time");
  const CENA = 4000, TOTAL = CENA * cenas.length;
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
    t += agora - ultimo;
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
