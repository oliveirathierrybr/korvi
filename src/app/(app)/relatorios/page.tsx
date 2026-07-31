import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReportFilters } from "@/components/reports/report-filters";
import { CashFlowChart } from "@/components/dashboard/cash-flow-chart";
import { CategoryPieChart } from "@/components/dashboard/category-pie-chart";
import { getReportsData } from "@/lib/data/reports";
import { formatCurrency, parseDateInput, toDateInputValue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { requireUserId } from "@/lib/session";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;
  const from = params.from ? parseDateInput(params.from) : undefined;
  const to = params.to ? parseDateInput(params.to) : undefined;

  const data = await getReportsData(userId, { from, to });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Analise a evolução financeira da empresa e exporte seus dados.
        </p>
      </div>

      <ReportFilters
        defaultFrom={toDateInputValue(data.from)}
        defaultTo={toDateInputValue(data.to)}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryChip label="Total de entradas" value={data.totalEntradas} tone="good" />
        <SummaryChip label="Total de saídas" value={data.totalSaidas} tone="bad" />
        <SummaryChip
          label="Resultado do período"
          value={data.resultado}
          tone={data.resultado >= 0 ? "good" : "bad"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entradas x Saídas por mês</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={data.monthly} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Entradas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={data.entradasByCategory}
              emptyMessage="Sem receitas registradas neste período."
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Saídas por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryPieChart
              data={data.saidasByCategory}
              emptyMessage="Sem despesas registradas neste período."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryChip({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "bad";
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-xl font-semibold tabular-nums",
            tone === "good" ? "text-[#0ca30c]" : "text-[#d03b3b]"
          )}
        >
          {formatCurrency(value)}
        </p>
      </CardContent>
    </Card>
  );
}
