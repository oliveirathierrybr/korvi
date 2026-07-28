import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BillDialog } from "@/components/bills/bill-dialog";
import {
  DeleteBillButton,
  MarkPaidButton,
  ReopenBillButton,
} from "@/components/bills/bill-actions";

type Direction = "PAGAR" | "RECEBER";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function BillsPageContent({ direction }: { direction: Direction }) {
  const isPagar = direction === "PAGAR";
  const contactLabel = isPagar ? "Fornecedor" : "Cliente";

  const [bills, categories] = await Promise.all([
    prisma.bill.findMany({
      where: { direction },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.category.findMany({
      where: { type: isPagar ? "SAIDA" : "ENTRADA" },
      orderBy: { name: "asc" },
    }),
  ]);

  const today = startOfToday();
  const pending = bills.filter((b) => b.status === "PENDENTE");
  const overdue = pending.filter((b) => b.dueDate < today);
  const totalPending = pending.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdue.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = bills
    .filter((b) => b.status === "PAGO")
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">
            {isPagar ? "Contas a Pagar" : "Contas a Receber"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isPagar
              ? "Compromissos financeiros da empresa."
              : "Valores que a empresa tem a receber."}
          </p>
        </div>
        <BillDialog direction={direction} categories={categories} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryChip
          label={isPagar ? "Total a pagar" : "Total a receber"}
          value={totalPending}
          tone="warning"
        />
        <SummaryChip
          label="Vencidas"
          value={totalOverdue}
          tone="critical"
          hint={`${overdue.length} conta(s)`}
        />
        <SummaryChip
          label={isPagar ? "Total pago" : "Total recebido"}
          value={totalPaid}
          tone="good"
        />
      </div>

      <Card>
        <CardContent className="overflow-x-auto pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vencimento</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>{contactLabel}</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    Nenhuma conta cadastrada.
                  </TableCell>
                </TableRow>
              ) : (
                bills.map((b) => {
                  const isOverdue = b.status === "PENDENTE" && b.dueDate < today;
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(b.dueDate)}
                      </TableCell>
                      <TableCell className="text-sm">{b.description}</TableCell>
                      <TableCell className="text-sm">{b.contactName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: b.category.color }}
                          />
                          {b.category.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={b.status} isOverdue={isOverdue} />
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatCurrency(b.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {b.status === "PENDENTE" ? (
                            <>
                              <MarkPaidButton id={b.id} direction={direction} />
                              <BillDialog
                                direction={direction}
                                categories={categories}
                                bill={{
                                  id: b.id,
                                  description: b.description,
                                  amount: b.amount,
                                  contactName: b.contactName,
                                  dueDate: b.dueDate,
                                  categoryId: b.categoryId,
                                }}
                              />
                              <DeleteBillButton id={b.id} />
                            </>
                          ) : (
                            <ReopenBillButton id={b.id} />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({
  status,
  isOverdue,
}: {
  status: "PENDENTE" | "PAGO" | "ATRASADO";
  isOverdue: boolean;
}) {
  if (status === "PAGO") {
    return (
      <Badge variant="outline" className="border-transparent bg-[#0ca30c]/10 text-[#0ca30c]">
        Pago
      </Badge>
    );
  }
  if (isOverdue) {
    return (
      <Badge variant="outline" className="border-transparent bg-[#d03b3b]/10 text-[#d03b3b]">
        Atrasado
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="border-transparent bg-[#fab219]/15 text-[#a15c00] dark:text-[#fab219]">
      Pendente
    </Badge>
  );
}

function SummaryChip({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: "good" | "warning" | "critical";
  hint?: string;
}) {
  const color =
    tone === "good" ? "#0ca30c" : tone === "critical" ? "#d03b3b" : "#a15c00";
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-semibold tabular-nums" style={{ color }}>
          {formatCurrency(value)}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}
