/* NEX Tecnologias — tela de entrada (clientes e equipe) */
(() => {
  const $ = (s) => document.querySelector(s);
  const formEntrar = $("#form-entrar");
  const formSenha = $("#form-senha");
  let usuario = null;

  // Só aceita voltar para uma página do próprio site.
  function destino() {
    const volta = new URLSearchParams(location.search).get("volta") || "";
    const local = volta.startsWith("/") && !volta.startsWith("//") ? volta : "";
    if (usuario.perfil === "admin") return local || "/admin";
    return local.startsWith("/portal") ? local : "/portal";
  }

  function seguir() {
    if (usuario.trocarSenha) {
      formEntrar.hidden = true;
      formSenha.hidden = false;
      $("#ola-senha").textContent = `Olá, ${usuario.nome.split(" ")[0]}! Este é o seu primeiro acesso. Defina uma senha pessoal para continuar.`;
      formSenha.senha.focus();
      return;
    }
    location.replace(destino());
  }

  async function enviando(form, fn) {
    const botao = form.querySelector("[type=submit]");
    botao.disabled = true;
    try {
      await fn();
    } finally {
      botao.disabled = false;
    }
  }

  formEntrar.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const erro = $("#erro-entrar");
    erro.textContent = "";
    const email = formEntrar.email.value.trim();
    const senha = formEntrar.senha.value;
    if (!email || !senha) {
      erro.textContent = "Informe e-mail e senha.";
      return;
    }
    enviando(formEntrar, async () => {
      try {
        ({ usuario } = await NEX.api("POST", "/api/entrar", { email, senha }));
        seguir();
      } catch (err) {
        erro.textContent = err.message;
      }
    });
  });

  formSenha.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const erro = $("#erro-senha");
    erro.textContent = "";
    const senha = formSenha.senha.value;
    if (senha.length < 8) return void (erro.textContent = "Use pelo menos 8 caracteres.");
    if (senha !== formSenha.confirma.value) return void (erro.textContent = "As senhas não conferem.");
    enviando(formSenha, async () => {
      try {
        await NEX.api("POST", "/api/minha-senha", { senha });
        usuario.trocarSenha = false;
        seguir();
      } catch (err) {
        erro.textContent = err.message;
      }
    });
  });

  // Quem já tem sessão vai direto (ou termina a troca de senha pendente).
  fetch("/api/eu", { credentials: "same-origin" })
    .then((r) => (r.ok ? r.json() : null))
    .then((json) => {
      if (!json) return formEntrar.email.focus();
      usuario = json.usuario;
      seguir();
    })
    .catch(() => {});
})();
