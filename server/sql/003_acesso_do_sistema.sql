-- Login administrativo do sistema entregue (ex.: admin da Jornada SAVA), mostrado ao cliente no portal.
ALTER TABLE projetos ADD COLUMN acesso_usuario TEXT NOT NULL DEFAULT '';
ALTER TABLE projetos ADD COLUMN acesso_senha   TEXT NOT NULL DEFAULT '';
