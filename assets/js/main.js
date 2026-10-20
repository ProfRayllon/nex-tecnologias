/* =========================================================
   LEST Tecnologia — interações da landing page
   ========================================================= */

// Textos do hero conforme o segmento escolhido
const SEGMENTS = {
  municipios: {
    word: "educação pública",
    text: "Modernize a rede municipal de ensino com plataformas em nuvem para formação de professores, processos seletivos e gestão educacional completa, com transparência e dados para decidir melhor.",
  },
  superior: {
    word: "sua instituição",
    text: "Atraia mais alunos e ofereça cursos EAD e híbridos de alto nível, com um CRM de captação do vestibular à matrícula e um AVA com a identidade da sua marca.",
  },
  escolas: {
    word: "sua escola",
    text: "Leve a sala de aula para o digital, simplifique as matrículas e aproxime as famílias com uma gestão educacional moderna, simples e acessível.",
  },
  empresas: {
    word: "sua equipe",
    text: "Treinamentos, onboarding e trilhas de desenvolvimento em uma universidade corporativa digital, com indicadores claros de aprendizagem e desempenho.",
  },
};

document.addEventListener("DOMContentLoaded", () => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Ano no rodapé ---------- */
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Header ao rolar ---------- */
  const header = $("#header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  const burger = $("#burger");
  const nav = $("#nav");
  const toggleMenu = (open) => {
    nav.classList.toggle("is-open", open);
    burger.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
  };
  burger.addEventListener("click", () => toggleMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Link ativo conforme a seção ---------- */
  const links = $$(".nav__link");
  const spy = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + e.target.id));
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );
  links.map((l) => $(l.getAttribute("href"))).filter(Boolean).forEach((s) => spy.observe(s));

  /* ---------- Reveal ao rolar ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("in-view");
        revealObs.unobserve(e.target);
      });
    },
    { threshold: 0.15 }
  );
  $$(".reveal").forEach((el) => {
    const siblings = $$(":scope > .reveal", el.parentElement);
    el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 80}ms`;
    revealObs.observe(el);
  });

  /* ---------- Contadores ---------- */
  const countObs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / 1600, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toLocaleString("pt-BR", {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          });
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        countObs.unobserve(el);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countObs.observe(el));

  /* ---------- Segmentos do hero ---------- */
  const heroWord = $("#hero-word");
  const heroText = $("#hero-text");
  const formSegment = $("#form-segment");
  $$(".segment").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.segment;
      $$(".segment").forEach((b) => {
        b.classList.toggle("is-active", b === btn);
        b.setAttribute("aria-selected", String(b === btn));
      });
      heroWord.classList.add("is-swapping");
      heroText.classList.add("is-swapping");
      setTimeout(() => {
        heroWord.textContent = SEGMENTS[key].word;
        heroText.textContent = SEGMENTS[key].text;
        heroWord.classList.remove("is-swapping");
        heroText.classList.remove("is-swapping");
      }, 250);
      // já deixa o segmento pré-selecionado no formulário
      if (formSegment) formSegment.value = key;
    });
  });

  /* ---------- Abas de soluções ---------- */
  const tabs = $$(".tab");
  const activateTab = (tab) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-active", on);
      t.setAttribute("aria-selected", String(on));
      const panel = $("#" + t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
  };
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => activateTab(t));
    t.addEventListener("keydown", (ev) => {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      const next = tabs[(i + (ev.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
      next.focus();
      activateTab(next);
    });
  });

  /* ---------- Cards de módulos levam à aba correspondente ---------- */
  $$("[data-goto-tab]").forEach((card) => {
    card.addEventListener("click", () => {
      activateTab($("#" + card.dataset.gotoTab));
      $("#solucoes").scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- Formulário de contato ---------- */
  const form = $("#contact-form");
  const msg = $("#form-msg");
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    let valid = true;
    $$("[required]", form).forEach((input) => {
      const ok = input.type === "checkbox" ? input.checked : input.checkValidity() && input.value.trim() !== "";
      input.closest(".field, .check").classList.toggle("is-invalid", !ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      msg.className = "form__msg err";
      msg.textContent = "Preencha os campos obrigatórios e aceite a política de privacidade.";
      return;
    }

    // TODO: integrar com o back-end / CRM (ex.: fetch("/api/contato", { method: "POST", body: new FormData(form) }))
    msg.className = "form__msg ok";
    msg.textContent = "Recebemos seu contato! Nossa equipe retornará em breve.";
    form.reset();
  });
});
