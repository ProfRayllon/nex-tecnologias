-- A aba de identidade visual sai do portal. Arquivos que restarem desse tipo deixam de ser listados.
DELETE FROM arquivos WHERE tipo = 'identidade';
ALTER TABLE arquivos DROP CONSTRAINT arquivos_tipo_check;
ALTER TABLE arquivos ADD CONSTRAINT arquivos_tipo_check
  CHECK (tipo IN ('orcamento', 'imagem', 'codigo', 'documento', 'video'));
