# Conexão bancária (Open Finance)

O Korvi permite conectar contas bancárias para importar saldo e
movimentações automaticamente, em vez de o usuário digitar tudo
manualmente. Esta página documenta a arquitetura, como testar localmente
com dados simulados, e o que falta para operar com um provedor real.

## Arquitetura

```
Frontend (Dialog "Conectar conta bancária")
  ↓
Server Actions (src/lib/actions/bank-accounts.ts)
  ↓
BankIntegrationService (src/lib/bank/bank-integration-service.ts) — o contrato
  ↓
MockBankProvider              OU              OpenFinanceProvider
(src/lib/bank/providers/               (src/lib/bank/providers/
  mock-bank-provider.ts)                 open-finance-provider.ts)
  ↓                                        ↓
Dados simulados                          Instituição financeira / agregador
                                          Open Finance certificado
```

`src/lib/bank/get-bank-provider.ts` decide qual implementação usar:

- **fora de "produção de verdade"** (`npm run dev`, ou um deploy de
  **Preview** na Vercel) → sempre `MockBankProvider`, mesmo que as
  variáveis de ambiente de produção estejam configuradas. Um deploy de
  Preview roda com `NODE_ENV=production` na Vercel, mas não é o site que
  clientes reais usam — por isso a checagem usa `VERCEL_ENV` (que
  distingue `production` de `preview`) em vez de `NODE_ENV` sozinho, para
  Preview continuar mostrando o modo simulado ao revisar a feature;
- **em produção de verdade, configurado** (as 4 variáveis abaixo
  presentes) → `OpenFinanceProvider`;
- **em produção de verdade, não configurado** → lança erro. O recurso
  fica **desabilitado** na UI ("Conexão bancária não disponível nesta
  instalação"), nunca cai silenciosamente em dados simulados apresentados
  como reais.

Nenhum código de UI, Server Action ou schema de banco de dados depende de
qual das duas implementações está ativa — ambas implementam exatamente a
mesma interface `BankIntegrationService`.

## Testando localmente (MockBankProvider)

1. `npm run dev`, faça login (`admin@empresa.com` / `mudar123`, seed
   padrão).
2. Acesse **Contas bancárias** no menu lateral → **Conectar conta
   bancária**.
3. O modal explica quais dados serão usados e mostra a grade de
   instituições simuladas (Banco do Brasil, Itaú, Bradesco, Santander,
   Caixa, Nubank, Banco Inter — nomes reais, dados totalmente fictícios).
4. Ao escolher uma instituição, você é redirecionado para
   `/open-finance-mock/[consentId]` — uma tela deliberadamente **fora** do
   layout do Korvi (sem sidebar), rotulada "AMBIENTE SIMULADO", com botões
   Autorizar/Negar. Isso existe para exercitar honestamente o mesmo
   formato de arquitetura que um provedor real usaria (redirecionar o
   usuário para fora do app e trazê-lo de volta via um callback).
5. Ao autorizar, você volta para `/contas-bancarias` com a conta conectada,
   saldo fake preenchido e algumas movimentações simuladas já
   sincronizadas.
6. "Sincronizar agora" busca novas movimentações fake a cada clique — útil
   para testar a fila de conciliação repetidamente.

O `MockBankProvider` grava a decisão de autorizar/negar direto no
`BankConsent.status` (feito pela Server Action da própria tela simulada,
`src/app/open-finance-mock/[consentId]/actions.ts`) — diferente de um
provider real, o Mock pode fazer isso porque ele representa nosso próprio
ambiente simulado, não um sistema externo de verdade.

## Colocando um provedor real em produção

`src/lib/bank/providers/open-finance-provider.ts` é um **stub estruturado,
não funcional** — todos os métodos lançam um erro explícito dizendo o que
falta. Isso é intencional: não inventamos endpoints, payloads ou forma de
autenticação de nenhuma instituição ou agregador específico sem ter a
especificação real na mão.

Para operar com uma conexão bancária real, é preciso primeiro, fora do
código:

1. **Contratar um provedor/agregador Open Finance certificado** (ex.:
   Pluggy, Belvo, Quanto) **ou** certificar a própria empresa como TPP
   (Third Party Provider) diretamente junto ao Banco Central — isso é um
   processo regulatório, não algo que se resolve só escrevendo código.
2. Obter as credenciais desse provedor: client id, client secret, URL base
   da API, e registrar a URL de redirecionamento (`OPEN_FINANCE_REDIRECT_URI`).

Só depois disso, no código:

3. Implementar de fato os métodos de `OpenFinanceProvider`
   (`listInstitutions`, `initiateConsent`, `getConsentStatus`,
   `fetchAccounts`, `fetchTransactions`, `revokeConsent`) usando o
   SDK/API real do provedor escolhido, seguindo a spec que ele fornecer.
4. Configurar as variáveis de ambiente em produção (ver `.env.example`):
   `OPEN_FINANCE_CLIENT_ID`, `OPEN_FINANCE_CLIENT_SECRET`,
   `OPEN_FINANCE_BASE_URL`, `OPEN_FINANCE_REDIRECT_URI`.
5. Nada mais muda — Server Actions, páginas, componentes e o schema do
   banco de dados já foram desenhados para funcionar com qualquer
   implementação de `BankIntegrationService`.

## Modelo de dados

- `BankConsent` — um pedido de autorização (1 por tentativa de conexão).
  `state` é o valor anti-CSRF verificado no callback.
- `BankAccount` — uma conta bancária conectada, vinculada a um
  `BankConsent`.
- `BankTransaction` — uma movimentação importada. `externalTransactionId` +
  `bankAccountId` formam a chave de idempotência (`@@unique`), então
  sincronizar de novo nunca duplica.
- `BankCategoryRule` — regra de categorização aprendida quando o usuário
  corrige a categoria sugerida de uma movimentação.
- `AuditLog` — trilha de auditoria (conectar/desconectar/sincronizar/
  categorizar/conciliar), sobrevive à exclusão do usuário.

Um `BankTransaction` só afeta o "Saldo atual" do dashboard depois de virar
um `Transaction` de verdade — automaticamente (conciliação por valor/data)
ou manualmente ("Criar lançamento" / "Vincular a conta a pagar/receber").
Isso evita que saldo bancário ainda não revisado entre silenciosamente nos
números principais do dashboard.
