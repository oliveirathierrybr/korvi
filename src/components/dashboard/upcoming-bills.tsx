import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarkPaidButton } from "@/components/bills/bill-actions";
import { formatCurrency, formatDate } from "@/lib/format";

type BillRow = {
  id: string;
  description: string;
  contactName: string;
  amount: number;
  dueDate: Date;
  direction: "PAGAR" | "RECEBER";
  category: { color: string; name: string };
};

export function UpcomingBills({
  overdue,
  dueSoon,
}: {
  overdue: BillRow[];
  dueSoon: BillRow[];
}) {
  const items = [...overdue, ...dueSoon];

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">Contas próximas do vencimento</CardTitle>
        {overdue.length > 0 ? (
          <Badge variant="outline" className="border-transparent bg-[#d03b3b]/10 text-[#d03b3b]">
            {overdue.length} atrasada(s)
          </Badge>
        ) : null}
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma conta a vencer nos próximos 7 dias.
          </p>
        ) : (
          <ul className="divide-y">
            {items.map((bill) => {
              const isOverdue = overdue.some((b) => b.id === bill.id);
              return (
                <li key={bill.id} className="flex items-center gap-3 py-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isOverdue ? "#d03b3b1a" : "#fab2191a",
                    }}
                  >
                    {isOverdue ? (
                      <AlertTriangle className="h-4 w-4 text-[#d03b3b]" />
                    ) : (
                      <Clock className="h-4 w-4 text-[#a15c00] dark:text-[#fab219]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {bill.description}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {bill.direction === "PAGAR" ? "Pagar a" : "Receber de"}{" "}
                      {bill.contactName} · {formatDate(bill.dueDate)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {formatCurrency(bill.amount)}
                  </p>
                  <MarkPaidButton id={bill.id} direction={bill.direction} />
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-2 flex justify-end gap-4 text-sm">
          <Link href="/contas-a-pagar" className="text-primary hover:underline">
            Ver contas a pagar
          </Link>
          <Link href="/contas-a-receber" className="text-primary hover:underline">
            Ver contas a receber
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
