# Vault Security Center

O **Vault Security Center** mostra o estado real do subsistema que protege as
credenciais privilegiadas armazenadas na plataforma — nunca uma chave, PIN ou
segredo, só status.

## O que cada campo significa

| Campo | Significado |
|---|---|
| **Vault Status** | `HEALTHY` quando o backend configurado está acessível e autenticado; `DEGRADED` quando há falha de conexão/autenticação. Com `DEGRADED`, toda operação que dependa de descriptografar um segredo (conectar, revelar, rotacionar, definir nova senha) é **recusada** — a plataforma nunca usa um segredo em cache pra continuar funcionando com o Vault fora do ar. |
| **Crypto Provider** | Qual backend está ativo: `Database` (armazenamento local, criptografado com a `SECRET_KEY` da aplicação), `HashiCorp Vault`, `Azure Key Vault` ou `Amazon Secrets Manager`. |
| **Hardware-backed** | Só aparece quando o backend é HashiCorp Vault. Lê o `seal-status` real do servidor Vault: `Yes` quando o mecanismo de auto-unseal não é Shamir puro (ou seja, algo como PKCS#11/HSM ou KMS de nuvem protege a chave raiz do Vault); `No` quando é Shamir (só software). Nunca é uma alegação — é lido do próprio Vault. |
| **Encryption Algorithm** | O algoritmo usado pela camada de criptografia da própria aplicação (AES-256-GCM), independente do backend escolhido. |
| **Last Crypto Health Check** | Quando o status acima foi calculado — cada carregamento da tela consulta o Vault ao vivo. |

## Como configurar

1. Vá em **Configurações → Recursos → Vault**.
2. Marque **Habilitado** e escolha o **Backend**: `HashiCorp Vault`, `Azure Key
   Vault` ou `Amazon Secrets Manager`. Deixe desabilitado para usar o
   armazenamento local (criptografado, mas com uma única chave global — ver
   recomendação abaixo).
3. Preencha os campos específicos do backend escolhido (endereço do servidor,
   token/credencial, ponto de montagem no caso do HashiCorp Vault).
4. Clique em **Testar** antes de salvar — isso valida a conexão sem afetar
   nenhum segredo já existente.
5. Depois de salvar, use **Sincronizar** para migrar os segredos que hoje
   estão no banco de dados local para o Vault configurado. A sincronização é
   **de mão única** (local → Vault); depois de concluída, o banco local não
   guarda mais o valor do segredo.
6. Volte ao Vault Security Center e confirme **Vault Status: HEALTHY** antes
   de considerar a migração concluída.

## Boas práticas

- **Produção deve usar HashiCorp Vault com auto-unseal via HSM/KMS**, não o
  armazenamento local puro. O armazenamento local depende inteiramente da
  `SECRET_KEY` da aplicação — quem tiver essa chave e uma cópia do banco
  consegue decifrar tudo. Com o Vault, um invasor precisaria comprometer
  **os dois** sistemas.
- **Nunca** armazene o token do Vault em texto plano fora do `.env.local` do
  ambiente — ele nunca deve ir para o Git, para logs ou para a imagem Docker.
- Monitore o campo **Vault Status** — se cair para `DEGRADED`, novas sessões
  que dependam de segredo param de funcionar imediatamente (comportamento
  intencional: falha fechada, nunca aberta).
- Depois de uma rotação de token/credencial do Vault no lado do servidor,
  atualize a configuração aqui e clique em **Testar** de novo antes de
  confiar no status.

## Permissões relacionadas (RBAC granular de credencial)

A visualização/uso de segredo não é uma permissão só — são várias,
independentes entre si, pra que um papel customizado possa conceder
exatamente o necessário:

| Permissão | O que permite |
|---|---|
| `accounts.view_accountsecret` | Ver o valor da credencial (revelar). Já exige MFA (step-up) automaticamente. |
| `accounts.copy_accountsecret` | Mostra o botão de copiar no diálogo de revelação. Sem essa permissão, o botão simplesmente não aparece. |
| `accounts.set_accountsecret` | Substituir o valor de uma credencial (inclusive "Limpar Segredo"). Não exige ver o valor anterior. |
| `accounts.change_account` | Editar metadados da conta (nome, usuário, política de rotação, tags) — **não** dá acesso ao segredo em si. |

Um administrador de plataforma **não** recebe `view_accountsecret`/
`copy_accountsecret` automaticamente por administrar a plataforma — essas
permissões precisam ser atribuídas explicitamente a um papel, o que reduz o
poder de uma conta administrativa comprometida.

## Revelação de segredo (Reveal)

- A revelação tem um **tempo de exibição configurável**
  (`SECURITY_SECRET_REVEAL_TTL_SECONDS`, padrão 15 segundos) — depois disso,
  o valor volta a ficar mascarado na tela automaticamente.
- Há **limite de taxa**: no máximo 5 revelações por minuto por usuário,
  independente de quantas credenciais diferentes.
- Toda revelação é auditada (evento `SECRET_REVEALED`), com quem, quando e
  qual credencial — nunca o valor em si.

## Contas de emergência (Break Glass)

Uma conta marcada como **Break Glass** nunca conecta diretamente — mesmo que
o usuário já tenha autorização de acesso ao ativo. A conexão exige uma
solicitação de acesso aprovada (o mesmo mecanismo de Ticket usado para
Regras de Acesso), com duas proteções adicionais:

- **Quem pede não pode aprovar a própria solicitação**, mesmo que tenha
  permissão de aprovador.
- **Quem aprova precisa ter autoridade real sobre o ativo** solicitado (não
  basta estar listado genericamente como aprovador).

Use Break Glass para contas de altíssimo privilégio (administrador de
domínio, root de firewall, DBA) que só devem ser usadas em emergência, nunca
no dia a dia.
