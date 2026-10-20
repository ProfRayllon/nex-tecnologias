/* =========================================================
   NEX Tecnologias — interações da landing page
   ========================================================= */

// Teste de tipografia: ?fonte=montserrat deixa os títulos também em Montserrat
if (new URLSearchParams(location.search).get("fonte") === "montserrat") {
  document.documentElement.classList.add("font-all-montserrat");
}

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
  const links = $$('.nav__link[href^="#"]');
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

  /* ---------- Fluxo do processo: uma etapa acende por vez ---------- */
  const stepsEl = $(".steps");
  if (stepsEl) {
    const steps = $$(".step", stepsEl);
    let cur = -1, timer;
    const next = () => {
      cur = (cur + 1) % steps.length;
      steps.forEach((s, k) => {
        s.classList.toggle("is-active", k === cur);
        s.classList.toggle("is-done", k < cur);
      });
      stepsEl.style.setProperty("--p", cur / (steps.length - 1));
    };
    new IntersectionObserver(([e]) => {
      clearInterval(timer);
      if (e.isIntersecting) { next(); timer = setInterval(next, 1800); }
    }, { threshold: 0.3 }).observe(stepsEl);
  }

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

  /* ---------- Vitrine de benefícios (troca automática) ---------- */
  const scItems = $$(".sc-item");
  const showItem = (item) => {
    scItems.forEach((it) => {
      const on = it === item;
      it.classList.toggle("is-active", on);
      it.setAttribute("aria-selected", String(on));
      const panel = $("#" + it.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-active", on);
    });
  };
  scItems.forEach((it, i) => {
    it.addEventListener("click", () => showItem(it));
    it.addEventListener("mouseenter", () => { if (window.matchMedia("(hover: hover)").matches) showItem(it); });
    it.addEventListener("keydown", (ev) => {
      if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp") return;
      ev.preventDefault();
      const next = scItems[(i + (ev.key === "ArrowDown" ? 1 : -1) + scItems.length) % scItems.length];
      next.focus();
      showItem(next);
    });
    // quando a barra de progresso enche, passa para o próximo
    $(".sc-item__bar i", it).addEventListener("animationend", () => showItem(scItems[(i + 1) % scItems.length]));
  });

  /* ---------- Formulário de contato ---------- */
  const form = $("#contact-form");
  const msg = $("#form-msg");
  form.addEventListener("submit", async (ev) => {
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

    // A mensagem vai para o banco da NEX e aparece no painel (/admin → Contatos do site).
    const botao = $("[type=submit]", form);
    botao.disabled = true;
    msg.className = "form__msg";
    msg.textContent = "Enviando…";
    try {
      const res = await fetch("/api/contato", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.erro || "Não foi possível enviar agora.");
      msg.className = "form__msg ok";
      msg.textContent = "Recebemos seu contato! Nossa equipe retornará em breve.";
      form.reset();
    } catch (err) {
      msg.className = "form__msg err";
      msg.textContent = `${err.message} Se preferir, fale com a gente pelo WhatsApp.`;
    } finally {
      botao.disabled = false;
    }
  });
});
