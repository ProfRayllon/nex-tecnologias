-- Segundo cliente: PrimeEdu (consultoria educacional).
-- A entrega é uma apresentação estática publicada no GitHub Pages, sem domínio nem banco de dados próprios.
-- A NEX guarda o cadastro, o projeto e os arquivos para o cliente baixar no portal.

INSERT INTO clientes (id, nome, razao_social, documento, telefone, observacoes)
VALUES (
  'c_prime_edu',
  'PrimeEdu',
  'PrimeEdu Consultoria Educacional',
  '60.551.676/0001-03',
  '(83) 99172-5396',
  'Apresentação publicada no GitHub Pages (profrayllon.github.io/prime-edu), sem domínio próprio. Orçamento: 6h × R$ 110 com 30% de desconto = R$ 462,00, pagamento integral. 1 semana de ajustes após a entrega.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projetos (id, cliente_id, nome, subtitulo, descricao, status, url_acesso, inicio, entrega, destaques, informacoes, tecnologias, identidade)
VALUES (
  'p_prime_edu',
  'c_prime_edu',
  'Apresentação PrimeEdu',
  'Proposta comercial interativa em 24 slides, com animações, vídeo e PDF',
  E'Apresentação comercial da PrimeEdu Consultoria Educacional, desenvolvida sob medida para rodar no navegador, online ou direto no computador.\n\nSão 24 slides em alta definição (1920×1080), organizados em cinco módulos: abertura, quem somos, programas de serviço, entregas e equipe, e fechamento. Cada slide tem animações de entrada, transições e efeitos próprios, como o contador do mapa da Paraíba, o brilho da logo na capa e o vídeo de 82 segundos com as entregas da consultoria.\n\nA apresentação é estática: não usa banco de dados nem servidor próprio. Está publicada gratuitamente no GitHub Pages e acompanha o PDF para envio, o vídeo, a identidade visual e o código-fonte completo.',
  'homologacao',
  'https://profrayllon.github.io/prime-edu/',
  '2026-10-22',
  '2026-10-23',
  '[
    "24 slides em 1920×1080, organizados em 5 módulos: abertura, quem somos, programas, entregas e equipe, fechamento",
    "Motor de apresentação próprio, com transições suaves, de empurrar e de morfose entre slides (magic move)",
    "Animações de entrada em cada elemento, em ritmo automático: surgir, subir, deslizar, saltar, crescer e cair",
    "Efeitos especiais: brilho da logo na capa, zoom lento da foto e contador animado até +550 no mapa da Paraíba",
    "Vídeo de entregas de 82 segundos, roteirizado e gravado quadro a quadro",
    "Programas Start, Plus e Prime em detalhe, com comparativo marcado coluna por coluna",
    "Identidade visual PrimeEdu aplicada: paleta, tipografia Montserrat e Inter, logos e favicon",
    "PDF da apresentação gerado automaticamente, com link para assistir ao vídeo online",
    "Notas do apresentador, atalhos de teclado, ir direto a um slide e tela cheia",
    "Publicada no GitHub Pages e também funciona sem internet, abrindo o arquivo no computador"
  ]'::jsonb,
  '[
    {"rotulo": "Endereço", "valor": "profrayllon.github.io/prime-edu (sem domínio próprio)"},
    {"rotulo": "Hospedagem", "valor": "GitHub Pages, gratuita"},
    {"rotulo": "Formato", "valor": "24 slides 16:9 (1920×1080) no navegador, mais PDF"},
    {"rotulo": "Banco de dados", "valor": "Não se aplica: apresentação estática"},
    {"rotulo": "Pagamento", "valor": "Integral, em parcela única via Pix"},
    {"rotulo": "Ajustes", "valor": "1 semana após a entrega, sobre o que foi construído"}
  ]'::jsonb,
  '[
    {"categoria": "Front-end", "nome": "HTML5"},
    {"categoria": "Front-end", "nome": "CSS3"},
    {"categoria": "Front-end", "nome": "JavaScript"},
    {"categoria": "Apresentação", "nome": "Player próprio (transições e animações)"},
    {"categoria": "Apresentação", "nome": "Mini-páginas animadas (iframe srcdoc)"},
    {"categoria": "Apresentação", "nome": "Canvas"},
    {"categoria": "Vídeo", "nome": "Playwright (gravação quadro a quadro)"},
    {"categoria": "Vídeo", "nome": "FFmpeg (MP4)"},
    {"categoria": "Automação", "nome": "Python (montagem do deck e zoom da capa)"},
    {"categoria": "Automação", "nome": "Node.js (geração do PDF)"},
    {"categoria": "Automação", "nome": "Microsoft Edge headless"},
    {"categoria": "Publicação", "nome": "Git e GitHub"},
    {"categoria": "Publicação", "nome": "GitHub Pages"},
    {"categoria": "Tipografia", "nome": "Montserrat"},
    {"categoria": "Tipografia", "nome": "Inter"}
  ]'::jsonb,
  '[
    {"nome": "Azul-marinho", "hex": "#0A1F5C"},
    {"nome": "Marinho", "hex": "#0B2A8A"},
    {"nome": "Azul", "hex": "#1E63E9"},
    {"nome": "Azul-claro", "hex": "#5B8DEF"},
    {"nome": "Azul suave", "hex": "#E6EEFD"},
    {"nome": "Laranja", "hex": "#F7931E"},
    {"nome": "Laranja escuro", "hex": "#E0740B"},
    {"nome": "Laranja suave", "hex": "#FFF1E0"},
    {"nome": "Texto", "hex": "#1F2937"},
    {"nome": "Texto secundário", "hex": "#4B5563"},
    {"nome": "Fundo", "hex": "#FBFCFE"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Acesso do cliente ao portal, com senha provisória (o portal pede uma senha pessoal no 1º acesso).
-- A senha em texto fica só no .env.acessos local, fora do Git.
INSERT INTO usuarios (id, nome, email, perfil, cliente_id, senha_hash, trocar_senha)
VALUES (
  'u_prime_edu',
  'PrimeEdu',
  'contato@primeedu.com.br',
  'cliente',
  'c_prime_edu',
  'scrypt$16384$07a01f7dd376f4c551daa565cfb57f93$9788627a9c6ec439bf8ed45f4d94927c7fba7ad6eacd5deff08f26d4089979e7d76cc4ab62e598e6c98d2bbf62641f029e5784c84498b14a3affb87ffedb1790',
  TRUE
)
ON CONFLICT DO NOTHING;
