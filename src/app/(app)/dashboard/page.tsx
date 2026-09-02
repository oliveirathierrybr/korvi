import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, Scale, Landmark, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { RecentBankTransactions } from "@/components/bank/recent-bank-transactions";
import { getDashboardData } from "@/lib/data/dashboard";
import { getBankAccountsOverview } from "@/lib/data/bank-accounts";
import { getSession } from "@/lib/session";
import { formatCurrency } from "@/lib/format";

export default async function DashboardPage() {
  const session = await getSession();
  const [data, bankOverview] = await Promise.all([
    getDashboardData(session!.userId),
    getBankAccountsOverview(session!.userId),
  ]);
  const firstName = session?.name.split(" ")[0] ?? "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Olá, {firstName || "bem-vindo"} 👋</h1>
        <p className="text-sm text-muted-foreground">
          Aqui está o resumo financeiro da sua empresa.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Saldo atual"
          value={data.balance}
          icon={Wallet}
          tone={data.balance >= 0 ? "good" : "bad"}
        />
        <KpiCard
          label="Entradas do mês"
          value={data.monthEntradas}
          icon={TrendingUp}
          tone="good"
        />
        <KpiCard
          label="Saídas do mês"
          value={data.monthSaidas}
          icon={TrendingDown}
          tone="bad"
        />
        <KpiCard
          label="Resultado do mês"
          value={data.monthResult}
          icon={Scale}
          tone={data.monthResult >= 0 ? "good" : "bad"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Fluxo de caixa (últimos 6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <CashFlowChart data={data.cashFlow} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saídas por categoria (mês atual)</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={data.expensesByCategory}
              emptyMessage="Sem despesas registradas neste mês."
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <UpcomingBills overdue={data.overdueBills} dueSoon={data.dueSoonBills} />
        <RecentTransactions transactions={data.recentTransactions} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Landmark className="h-4 w-4" />
            Contas bancárias
          </CardTitle>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/contas-bancarias" />}>
            {bankOverview.accounts.length > 0 ? "Ver todas" : "Conectar conta"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {bankOverview.accounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Conecte uma conta bancária para importar saldo e movimentações
              automaticamente.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Saldo bancário consolidado</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {formatCurrency(bankOverview.consolidatedBalance)}
                </p>
              </div>
              <RecentBankTransactions
                transactions={bankOverview.recentBankTransactions.slice(0, 5)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
