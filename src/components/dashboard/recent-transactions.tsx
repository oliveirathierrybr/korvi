import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type TxRow = {
  id: string;
  type: "ENTRADA" | "SAIDA";
  amount: number;
  description: string;
  date: Date;
  category: { name: string; color: string };
};

export function RecentTransactions({ transactions }: { transactions: TxRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Últimos lançamentos</CardTitle>
        <Link href="/caixa" className="text-sm text-primary hover:underline">
          Ver caixa
        </Link>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhum lançamento registrado ainda.
          </p>
        ) : (
          <ul className="divide-y">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: t.category.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.category.name} · {formatDate(t.date)}
                  </p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-sm font-medium tabular-nums",
                    t.type === "ENTRADA" ? "text-[#0ca30c]" : "text-[#d03b3b]"
                  )}
                >
                  {t.type === "ENTRADA" ? "+" : "-"}
                  {formatCurrency(t.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
