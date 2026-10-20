-- Primeiro cliente: Jornada SAVA (Sebadelhe Aranha & Vasconcelos Advocacia).
-- O sistema roda fora daqui, no domínio próprio; a NEX guarda só o cadastro, o projeto e as entregas.
-- O acesso do cliente ao portal é criado no painel (/admin → Acessos).

INSERT INTO clientes (id, nome, razao_social, cidade, observacoes)
VALUES (
  'c_jornada_sava',
  'Jornada SAVA',
  'Sebadelhe Aranha & Vasconcelos Advocacia',
  '',
  'Sistema publicado em VPS própria, domínio jornadasava.com.br.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO projetos (id, cliente_id, nome, subtitulo, descricao, status, url_acesso, destaques, informacoes, tecnologias)
VALUES (
  'p_jornada_sava',
  'c_jornada_sava',
  'Jornada SAVA',
  'Site institucional, painel de ranking e sistema de lançamentos',
  E'Plataforma do programa de valorização e desenvolvimento do Sebadelhe Aranha & Vasconcelos Advocacia.\n\nReúne o site institucional da jornada, o sistema em que administração, RH e líderes lançam avaliações, eventos, indicações e missões, e o painel de ranking com níveis e selos, atualizado em tempo real para toda a equipe.',
  'homologacao',
  'https://jornadasava.com.br',
  '[
    "Site institucional com hall da fama, premiações e regras da jornada",
    "Login com perfis de administração, RH e líderes, com permissões conferidas no servidor",
    "Lançamentos de avaliações, eventos, indicações, missões e protagonismo",
    "Painel de ranking com níveis, selos e filtros por bimestre",
    "Atualização em tempo real para todos os usuários conectados",
    "Importação da base histórica a partir das planilhas da jornada",
    "Senhas protegidas com scrypt e sessões seguras em cookie httpOnly",
    "HTTPS automático e rotina de backup diário do banco"
  ]'::jsonb,
  '[
    {"rotulo": "Domínio", "valor": "jornadasava.com.br"},
    {"rotulo": "Hospedagem", "valor": "VPS Linux dedicada com Docker"},
    {"rotulo": "Banco de dados", "valor": "PostgreSQL 16"},
    {"rotulo": "Segurança", "valor": "HTTPS (Let''s Encrypt), senhas com scrypt, sessões httpOnly"},
    {"rotulo": "Backup", "valor": "Cópia diária do banco na própria VPS"}
  ]'::jsonb,
  '[
    {"categoria": "Front-end", "nome": "HTML5"},
    {"categoria": "Front-end", "nome": "CSS3"},
    {"categoria": "Front-end", "nome": "JavaScript"},
    {"categoria": "Back-end", "nome": "Node.js 22"},
    {"categoria": "Back-end", "nome": "Express"},
    {"categoria": "Back-end", "nome": "Server-Sent Events (tempo real)"},
    {"categoria": "Banco de dados", "nome": "PostgreSQL 16"},
    {"categoria": "Infraestrutura", "nome": "Docker e Docker Compose"},
    {"categoria": "Infraestrutura", "nome": "Caddy (HTTPS automático)"},
    {"categoria": "Infraestrutura", "nome": "VPS Linux (Ubuntu)"},
    {"categoria": "Dados", "nome": "Python (tratamento das planilhas)"},
    {"categoria": "Ferramentas", "nome": "Git e GitHub"}
  ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;
