import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getBankAccountsOverview, getOpenBillsForLinking } from "@/lib/data/bank-accounts";
import { getBankProvider, isBankIntegrationAvailable, isMockProviderActive } from "@/lib/bank/get-bank-provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConnectBankModal } from "@/components/bank/connect-bank-modal";
import { BankAccountCard } from "@/components/bank/bank-account-card";
import { ReconciliationQueue } from "@/components/bank/reconciliation-queue";
import { RecentBankTransactions } from "@/components/bank/recent-bank-transactions";
import { formatCurrency } from "@/lib/format";
import { SyncAllButton } from "@/components/bank/sync-all-button";

export default async function ContasBancariasPage({
  searchParams,
}: {
  searchParams: Promise<{ bankConnected?: string; bankRejected?: string; bankError?: string }>;
}) {
  const userId = await requireUserId();
  const { bankConnected, bankRejected, bankError } = await searchParams;

  const [overview, categories, openBills] = await Promise.all([
    getBankAccountsOverview(userId),
    prisma.category.findMany({ where: { userId } }),
    getOpenBillsForLinking(userId),
  ]);

  const available = isBankIntegrationAvailable();
  const institutions = available ? await getBankProvider().listInstitutions() : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contas bancárias</h1>
          <p className="text-sm text-muted-foreground">
            Conecte suas contas via Open Finance para importar saldo e movimentações
            automaticamente.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overview.accounts.length > 0 ? <SyncAllButton /> : null}
          {available ? (
            <ConnectBankModal institutions={institutions} isMockMode={isMockProviderActive()} />
          ) : null}
        </div>
      </div>

      {bankConnected ? (
        <Alert>
          <CheckCircle2 className="h-4 w-4 text-[#0ca30c]" />
          <AlertTitle>Conta conectada com sucesso</AlertTitle>
          <AlertDescription>Suas movimentações estão sendo sincronizadas.</AlertDescription>
        </Alert>
      ) : null}
      {bankRejected ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Autorização não concluída</AlertTitle>
          <AlertDescription>A conexão bancária foi negada ou cancelada.</AlertDescription>
        </Alert>
      ) : null}
      {bankError ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertTitle>Não foi possível conectar</AlertTitle>
          <AlertDescription>{decodeURIComponent(bankError)}</AlertDescription>
        </Alert>
      ) : null}

      {!available ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Conexão bancária não disponível</AlertTitle>
          <AlertDescription>
            A integração Open Finance ainda não foi configurada nesta instalação.
          </AlertDescription>
        </Alert>
      ) : null}

      {overview.accounts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Saldo bancário consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold tabular-nums">
              {formatCurrency(overview.consolidatedBalance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Somatório das contas conectadas — separado do &quot;Saldo atual&quot; do
              dashboard, que só reflete lançamentos conciliados no caixa.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-3">
        {overview.accounts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma conta bancária conectada ainda.
          </p>
        ) : (
          overview.accounts.map((account) => (
            <BankAccountCard key={account.id} account={account} />
          ))
        )}
      </div>

      {overview.accounts.length > 0 ? (
        <>
          <div>
            <h2 className="mb-2 text-lg font-medium">Fila de conciliação</h2>
            <ReconciliationQueue
              transactions={overview.pendingReconciliation}
              categories={categories}
              openBills={openBills}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Movimentações recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentBankTransactions transactions={overview.recentBankTransactions} />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
