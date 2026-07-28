import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
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
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button";
import type { Prisma } from "@/generated/prisma/client";

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const where: Prisma.TransactionWhereInput = {};
  if (params.type === "ENTRADA" || params.type === "SAIDA") {
    where.type = params.type;
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params.from || params.to) {
    where.date = {};
    if (params.from) where.date.gte = new Date(params.from);
    if (params.to) where.date.lte = new Date(`${params.to}T23:59:59`);
  }

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalEntradas = transactions
    .filter((t) => t.type === "ENTRADA")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalSaidas = transactions
    .filter((t) => t.type === "SAIDA")
    .reduce((sum, t) => sum + t.amount, 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Caixa</h1>
          <p className="text-sm text-muted-foreground">
            Todas as entradas e saídas registradas.
          </p>
        </div>
        <TransactionDialog categories={categories} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryChip label="Entradas no período" value={totalEntradas} tone="good" />
        <SummaryChip label="Saídas no período" value={totalSaidas} tone="bad" />
        <SummaryChip label="Saldo do período" value={saldo} tone={saldo >= 0 ? "good" : "bad"} />
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <TransactionFilters categories={categories} />

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Nenhum lançamento encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell className="text-sm">{t.description}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 text-sm">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: t.category.color }}
                          />
                          {t.category.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            t.type === "ENTRADA"
                              ? "border-transparent bg-[#0ca30c]/10 text-[#0ca30c]"
                              : "border-transparent bg-[#d03b3b]/10 text-[#d03b3b]"
                          )}
                        >
                          {t.type === "ENTRADA" ? "Entrada" : "Saída"}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "text-right text-sm font-medium tabular-nums",
                          t.type === "ENTRADA" ? "text-[#0ca30c]" : "text-[#d03b3b]"
                        )}
                      >
                        {t.type === "ENTRADA" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell>
                        {t.billId ? null : (
                          <div className="flex justify-end gap-1">
                            <TransactionDialog
                              categories={categories}
                              transaction={{
                                id: t.id,
                                type: t.type,
                                amount: t.amount,
                                description: t.description,
                                date: t.date,
                                categoryId: t.categoryId,
                              }}
                            />
                            <DeleteTransactionButton id={t.id} />
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
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
