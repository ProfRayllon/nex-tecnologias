# Auditoria de credenciais — NEX Tecnologias

Data: 22/10/2026 (America/Sao_Paulo).

**Atualização após autorização:** a rotação em produção foi concluída; veja a seção 7.
As seções 1 a 6 registram a auditoria inicial, anterior à manutenção autorizada.

## 1. Vulnerabilidade e origem provável

**Risco alto se a senha publicada foi utilizada.** O código possuía uma senha
administrativa fixa como alternativa a `ADMIN_PASSWORD`, e o README publicava o
par e-mail empresarial/senha. A conexão PostgreSQL local também tinha credenciais
fixas como alternativa a `DATABASE_URL`. Os valores não são reproduzidos aqui.

Introdução: commit **`7240586`**, de **20/10/2026 às 14:49:42 -03:00**. Os padrões
continuam recuperáveis no histórico. A consulta somente de leitura ao GitHub
confirmou que `main` corresponde ao HEAD local
`c92157a0bdd08e503c558cb6b61f7a62310b8b9f`; não houve fetch ou publicação.

O par do README é uma **origem provável** do alerta “Company Email Password”.
A correlação exata depende do arquivo/commit informados pelo GitGuardian.
Esse e-mail identifica a conta do portal; não comprova exposição da senha da caixa
postal. Não foram encontrados SMTP, Nodemailer ou serviço de envio no código e no
histórico examinados da NEX. `POST /api/contato` grava no PostgreSQL;
`ACME_EMAIL` é o contato dos certificados HTTPS.

## 2. Arquivos afetados e outros achados

Linhas referentes ao HEAD anterior às correções:

| Local | Evidência e risco |
| --- | --- |
| `server/src/config.js:18` | Senha administrativa padrão; risco alto se utilizada |
| `README.md:116-117` | Publicação do par e-mail/senha padrão; provável origem do alerta |
| `server/src/config.js:13`, `README.md:112` | Conexão local com senha fixa; risco alto se reutilizada em banco acessível; produção não confirmada |
| `.env.example` | Senhas eram marcadores de substituição, não segredos identificados; endereços e configuração tornados fictícios |
| `.env.vps:3`, `.env.acessos:5,9,15` | Credenciais locais reais em texto simples, ignoradas; nenhuma correspondência no histórico da NEX; valores preservados |
| `server/sql/003_acesso_do_sistema.sql`, `server/src/admin.js`, `server/src/db.js` | `projetos.acesso_senha` guarda senha recuperável e a devolve ao cliente autorizado; risco adicional para banco e backups, sem evidência de relação com o alerta |

`Jornada SAVA/` é outro repositório, ignorado pela NEX. A leitura de seus 27 commits
locais também encontrou padrões de senha administrativa e conexão no config e no
README, introduzidos por **`e21614f`**, em 20/10/2026. Não foi modificado por esta
correção do repositório NEX.

O ZIP ignorado
`entregas/jornada-sava/codigo-fonte/Jornada SAVA - Codigo-fonte v1.0 (2026-10-20).zip`
contém esses padrões em `jornada-sava/README.md` e `jornada-sava/server/src/config.js`.
Contém somente `.env.example` como ambiente; não foram encontradas correspondências
das credenciais locais reais nesse pacote. Corrigir o SAVA e substituir a entrega
exige coordenação com esse projeto separado.

Não foi alterado o armazenamento recuperável de senhas de sistemas entregues:
uma substituição exige definir gestão de chaves, migração e impacto no portal.
O conteúdo real do banco não foi acessado.

## 3. Correções locais realizadas

- Removidas a senha administrativa padrão e a conexão com credenciais fixas.
- `DATABASE_URL` agora é obrigatória, com erro sem revelar seu valor.
- `ADMIN_PASSWORD` é exigida apenas ao criar o primeiro administrador; uma conta
  existente não é recriada nem tem a senha alterada.
- `.env.example` usa endereços fictícios e senhas vazias.
- `.gitignore` e `.dockerignore` protegem `.env*`, incluindo cópias e variantes,
  exceto `.env.example`, e arquivos comuns de autenticação/chaves.
  No Docker, foram incluídas regras explícitas para subdiretórios, seguindo a
  [sintaxe de exclusão documentada](https://docs.docker.com/build/concepts/context/#syntax).
- README atualizado e cinco testes isolados adicionados em
  `server/test/security-config.test.js`.

As credenciais locais reais não foram editadas ou apagadas. Já estavam fora do
índice; não foi necessário `git rm`. Rotas, dependências, migrações SQL e mapeamento
do Compose foram preservados. Não foi criada nem removida integração de e-mail.

## 4. Validação e limites

- Examinados **23 commits e 173 versões únicas de arquivos** da NEX, incluindo
  referências e reflogs, com busca local por senhas, SMTP, tokens/chaves e
  correspondências com credenciais locais.
- `git fsck --full --unreachable --no-reflogs`: íntegro, sem objetos inacessíveis.
- Arquivo de ambiente rastreado: **somente `.env.example`**.
- `git ls-files -ci --exclude-standard`: nenhum arquivo rastreado coberto pelos ignores.
- `git check-ignore --no-index`: `.env`, `.env.production`, `.env.local`, `.env.vps`,
  `.env.acessos`, variantes, ambientes em subdiretórios e arquivos de chaves protegidos;
  `.env.example` permitido.
- Os antigos padrões da NEX não aparecem mais nos arquivos atuais desse repositório;
  permanecem no histórico.
- `node --test server/test/security-config.test.js`: **5 testes aprovados**, sem banco
  ou rede. Cobrem falta de conexão, preservação da configuração recebida, preservação
  de administrador existente e criação inicial apenas com senha explícita.
- `git diff --check` e verificação sintática do JavaScript aprovados.

O Compose já transmite `DATABASE_URL` e exige `ADMIN_PASSWORD` e `POSTGRES_PASSWORD`.
Não havia `.env` ou `.env.production` local para validar os valores efetivos da VPS.
Docker não está disponível; não foram executados build ou Compose. Os testes usam
Node.js 24 local; a imagem declarada usa Node.js 22.

Não houve conexão ao banco, login, envio de e-mail, acesso à VPS, rotação ou reinício.
A coerência com o Compose declarado foi verificada; o funcionamento real em produção
continua pendente de validação controlada. A varredura não cobre PRs/forks/caches,
Actions, imagens publicadas, logs ou backups remotos, nem garante detectar todo tipo
de segredo. Não houve scanner externo ou envio dos segredos para análise.

## 5. Credenciais a substituir manualmente

1. **Qualquer conta que utilizou os padrões publicados**, na NEX ou no SAVA:
   considerar comprometida, trocar por senha exclusiva e invalidar sessões antigas.
2. **E-mail empresarial e SMTP**, se reutilizaram uma senha publicada ou se o alerta
   identificar a senha real: trocar no provedor, revogar senhas de aplicativo
   pertinentes e atualizar os serviços dependentes em conjunto. Não foi confirmada
   uma senha SMTP real no repositório.
3. **PostgreSQL**, caso a senha padrão tenha sido utilizada ou o alerta confirme
   outra credencial exposta: coordenar troca no banco e na conexão da aplicação.
   O padrão encontrado era local; não prova a senha usada pela VPS.
4. **VPS e acessos nos `.env` locais**: sem evidência de exposição desses valores no
   histórico examinado; trocar se houver reutilização ou outra evidência de vazamento.

Alterar só `ADMIN_PASSWORD` não redefine um usuário já persistido. Alterar só
`POSTGRES_PASSWORD` no `.env` não troca a senha de um PostgreSQL com volume
inicializado. Não remover volumes para rotacionar. O Compose interpola a senha na
URL sem codificação automática; considerar isso ao planejar uma substituição.

## 6. GitHub, servidor e autorização

Priorizar a revogação/rotação de qualquer segredo utilizável exposto antes da limpeza,
como orienta a [documentação oficial do GitHub](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

- **GitGuardian:** confirmar arquivo/commit sem copiar o segredo para chat ou logs;
  registrar revogação antes de encerrar o caso.
- **GitHub:** publicar as correções após autorização, habilitar proteção de push e
  detecção de segredos quando disponíveis, revisar PRs, forks, releases e artefatos.
- **Histórico:** um commit de correção não remove os pares antigos. Para eliminá-los
  do histórico publicado, planejar `git-filter-repo` em cópia isolada, cobrindo os
  valores em todos os caminhos, branches e tags, e force-push autorizado. Coordenar
  a atualização das cópias dos colaboradores e avaliar referências/caches com o GitHub.
  Nada disso foi executado. A limpeza não substitui rotação; se os padrões nunca
  foram usados, não há prova de comprometimento de uma credencial operacional.
- **Servidor:** antes do deploy, confirmar as variáveis sem imprimi-las, preparar
  backup restrito e plano de retorno, coordenar rotação/sessões e revisar logs de
  acesso. Após aplicar, validar banco, portal e formulário. Preservar volumes de banco
  e uploads, restringir acesso aos arquivos de segredos e evitar sua inclusão em logs,
  imagens e diretórios públicos.
- **SAVA e entregas:** coordenar a mesma remoção de padrões no repositório separado,
  verificar utilização real e regenerar/substituir o ZIP distribuído.

Dependem de autorização: commits/publicação, reescrita/force-push, deploy/reinício,
alterações no banco, rotação coordenada ou revogação de sessões e mudança do
armazenamento de senhas no portal. Nenhuma ação em produção foi executada.
A imagem não rastreada que já existia no início do trabalho foi preservada.

## 7. Rotação autorizada e concluída em produção — 22/10/2026

O usuário autorizou a janela de manutenção e a troca de todos os acessos. Foram
substituídas **sete senhas**, distintas e geradas com fonte criptográfica aleatória:

- Três usuários do portal NEX: um administrador e dois clientes.
- Um administrador do SAVA.
- O usuário do PostgreSQL da NEX e o usuário do PostgreSQL do SAVA.
- A conta root da VPS, com novo login SSH confirmado antes de encerrar o acesso antigo.

As sessões anteriores dos quatro usuários foram invalidadas. Os hashes foram
atualizados usando a implementação de senha de cada aplicação. A credencial do SAVA
armazenada no projeto do portal NEX foi sincronizada e verificada. Os `.env` de
produção foram atualizados, com permissão 600, incluindo a configuração de criação
inicial do administrador. Os arquivos locais `.env.acessos` e `.env.vps` também foram
atualizados; continuam fora do Git.

Antes das alterações foram criados backups dos dois bancos e dos dois arquivos de
ambiente em `/root/credential-rotation-20261022T173125Z`, com diretório 700 e arquivos
600. Os containers de banco e aplicação foram recriados individualmente por projeto,
reutilizando as imagens e os mesmos volumes. Não houve remoção de volumes nem
publicação de código. As correções locais do código ainda precisam ser publicadas
e implantadas em uma etapa própria.

Validação concluída:

- Quatro logins e os respectivos hashes verificados; as sessões de teste foram encerradas.
- Conexões novas aos dois bancos aprovadas e senhas antigas rejeitadas por autenticação.
- Os únicos papéis de login encontrados nos bancos foram `nex` e `sava`; ambos rotacionados.
- Novo login root por SSH aprovado, com a chave do servidor conferida em `known_hosts`.
- Os quatro containers de aplicação/banco estão saudáveis; imagens e volumes preservados.
- HTTPS dos dois sites e de `/api/saude` retorna HTTP 200.
- `.env` não é rastreado em nenhum dos dois repositórios no servidor.

O usuário informou que **ainda não existe provedor para a caixa de e-mail**.
Consequentemente, não havia senha de caixa postal ou SMTP a rotacionar.

As novas credenciais foram salvas apenas em arquivo local com acesso restrito ao
usuário atual e SYSTEM, em `.env-rotacao/NOVAS-SENHAS.txt`, dentro de diretório ignorado
pelo Git e pelo contexto Docker. Não são reproduzidas neste relatório. O diretório
também contém registros privados para recuperação da manutenção.

Pendências: confirmar a ocorrência exata do GitGuardian, publicar/implantar as
correções de código, coordenar a limpeza do histórico e a correção do código/ZIP do
SAVA, e avaliar a substituição do armazenamento recuperável de senhas no portal.
Também foi observado que os usuários das aplicações nos bancos têm privilégio de
superusuário; a redução desses privilégios exige separar as necessidades de migração
e execução e não foi realizada como parte desta troca de senhas.

## 8. Publicação, histórico e implantação concluídos — 22/10/2026

Após nova autorização do proprietário, as correções foram publicadas nos repositórios
NEX e SAVA. Os históricos foram saneados em clones isolados com `git-filter-repo`,
após backups privados, removendo os padrões identificados dos arquivos e mensagens.
As branches remotas existentes foram preservadas e atualizadas com proteção contra
sobrescrita de alterações concorrentes. Não foram anunciadas referências de PRs ou tags.
Foram verificados 308 objetos na NEX e 236 no SAVA sem os padrões antigos ou as sete
senhas novas; a árvore da aplicação atual foi preservada pela limpeza do histórico.

Os commits de código saneados são `2131580803ff429d75dbfe0889434f3ca2018888` (NEX)
e `863eb179f4fdaf88a2537eee9bc0290118cbbf74` (SAVA). As cópias locais e da VPS foram
atualizadas. As imagens das aplicações foram reconstruídas e implantadas com plano de
retorno, preservando as configurações de produção e os volumes. Os bancos não foram
reiniciados nesta implantação de código. Os dez testes locais dos projetos passaram.

O pacote de entrega do SAVA foi regenerado a partir do código saneado e publicado
como versão 1.1, com o mesmo identificador de download no portal. O download
autenticado foi conferido por tamanho e SHA-256. As cópias locais de entrega também
foram substituídas, preservando os originais apenas nos backups privados.

As senhas rotacionadas continuam fora do Git. Outros clones antigos devem ser
substituídos ou reconciliados antes de novos pushes para evitar recontaminação.
A limpeza das branches publicadas não garante remoção de caches do GitHub, forks
ou cópias de terceiros; a correlação com o alerta específico do GitGuardian ainda
depende do arquivo/commit informado pelo detector. Permanecem para planejamento
separado a redução dos privilégios do banco e a substituição do armazenamento
recuperável de senhas de sistemas entregues.
