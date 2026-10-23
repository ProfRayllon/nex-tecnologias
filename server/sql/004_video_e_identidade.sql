-- Entregas que vão além de um sistema web (ex.: apresentação da PrimeEdu): vídeo e identidade visual.
ALTER TABLE arquivos DROP CONSTRAINT arquivos_tipo_check;
ALTER TABLE arquivos ADD CONSTRAINT arquivos_tipo_check
  CHECK (tipo IN ('orcamento', 'imagem', 'codigo', 'documento', 'video', 'identidade'));

-- Paleta da marca, mostrada na aba Identidade visual: [{"nome": "Azul", "hex": "#1E63E9"}]
ALTER TABLE projetos ADD COLUMN identidade JSONB NOT NULL DEFAULT '[]';
