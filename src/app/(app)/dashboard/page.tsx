import { Wallet, TrendingUp, TrendingDown, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { UpcomingBills } from "@/components/dashboard/upcoming-bills";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { getDashboardData } from "@/lib/data/dashboard";
import { getSession } from "@/lib/session";

export default async function DashboardPage() {
  const session = await getSession();
  const data = await getDashboardData(session!.userId);
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
    </div>
  );
}
