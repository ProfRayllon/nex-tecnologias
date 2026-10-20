-- Estrutura inicial da NEX Tecnologias: clientes, acessos, projetos e arquivos entregues.

CREATE TABLE clientes (
  id            TEXT PRIMARY KEY,
  nome          TEXT NOT NULL,              -- nome de exibição (ex.: Jornada SAVA)
  razao_social  TEXT NOT NULL DEFAULT '',
  documento     TEXT NOT NULL DEFAULT '',   -- CNPJ/CPF
  contato_nome  TEXT NOT NULL DEFAULT '',
  email         TEXT NOT NULL DEFAULT '',
  telefone      TEXT NOT NULL DEFAULT '',
  cidade        TEXT NOT NULL DEFAULT '',
  observacoes   TEXT NOT NULL DEFAULT '',   -- anotações internas, o cliente não vê
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quem entra no site: a equipe NEX (admin) e os usuários de cada cliente.
CREATE TABLE usuarios (
  id             TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  perfil         TEXT NOT NULL CHECK (perfil IN ('admin', 'cliente')),
  cliente_id     TEXT REFERENCES clientes (id) ON DELETE CASCADE,
  senha_hash     TEXT NOT NULL,
  ativo          BOOLEAN NOT NULL DEFAULT TRUE,
  trocar_senha   BOOLEAN NOT NULL DEFAULT FALSE,
  ultimo_acesso  TIMESTAMPTZ,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (perfil = 'admin' OR cliente_id IS NOT NULL)
);
CREATE INDEX usuarios_cliente_idx ON usuarios (cliente_id);

CREATE TABLE sessoes (
  token_hash  TEXT PRIMARY KEY,
  usuario_id  TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_em   TIMESTAMPTZ NOT NULL
);
CREATE INDEX sessoes_usuario_idx ON sessoes (usuario_id);

-- Sistemas vendidos/entregues a cada cliente.
CREATE TABLE projetos (
  id            TEXT PRIMARY KEY,
  cliente_id    TEXT NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  subtitulo     TEXT NOT NULL DEFAULT '',
  descricao     TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'proposta'
                CHECK (status IN ('proposta', 'aprovado', 'desenvolvimento', 'homologacao', 'entregue')),
  url_acesso    TEXT NOT NULL DEFAULT '',   -- endereço do sistema (domínio próprio do cliente)
  url_codigo    TEXT NOT NULL DEFAULT '',   -- repositório, se houver; o ZIP fica em "arquivos"
  destaques     JSONB NOT NULL DEFAULT '[]', -- ["Funcionalidade", ...]
  informacoes   JSONB NOT NULL DEFAULT '[]', -- [{"rotulo": "...", "valor": "..."}]
  tecnologias   JSONB NOT NULL DEFAULT '[]', -- [{"categoria": "...", "nome": "..."}]
  inicio        DATE,
  entrega       DATE,
  visivel       BOOLEAN NOT NULL DEFAULT TRUE, -- falso: só a NEX vê
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX projetos_cliente_idx ON projetos (cliente_id);

-- Orçamento (PDF), telas do sistema, código-fonte e outros documentos.
-- O arquivo fica em disco (pasta uploads/) e só sai pela API, conferindo a sessão.
CREATE TABLE arquivos (
  id             TEXT PRIMARY KEY,
  projeto_id     TEXT NOT NULL REFERENCES projetos (id) ON DELETE CASCADE,
  tipo           TEXT NOT NULL CHECK (tipo IN ('orcamento', 'imagem', 'codigo', 'documento')),
  titulo         TEXT NOT NULL DEFAULT '',
  legenda        TEXT NOT NULL DEFAULT '',
  nome_original  TEXT NOT NULL,
  mime           TEXT NOT NULL,
  tamanho        BIGINT NOT NULL,
  caminho        TEXT NOT NULL,
  ordem          INTEGER NOT NULL DEFAULT 0,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX arquivos_projeto_idx ON arquivos (projeto_id);

-- Mensagens do formulário de contato do site.
CREATE TABLE contatos (
  id           TEXT PRIMARY KEY,
  nome         TEXT NOT NULL,
  email        TEXT NOT NULL,
  telefone     TEXT NOT NULL DEFAULT '',
  instituicao  TEXT NOT NULL DEFAULT '',
  cidade       TEXT NOT NULL DEFAULT '',
  segmento     TEXT NOT NULL DEFAULT '',
  interesse    TEXT NOT NULL DEFAULT '',
  mensagem     TEXT NOT NULL DEFAULT '',
  lido         BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- O que os clientes fazem no portal (entradas e downloads), para a NEX acompanhar.
CREATE TABLE registros (
  id          BIGSERIAL PRIMARY KEY,
  usuario_id  TEXT REFERENCES usuarios (id) ON DELETE SET NULL,
  cliente_id  TEXT REFERENCES clientes (id) ON DELETE CASCADE,
  acao        TEXT NOT NULL,
  detalhe     TEXT NOT NULL DEFAULT '',
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX registros_data_idx ON registros (criado_em DESC);
