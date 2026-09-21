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
import { Pagination } from "@/components/pagination";
import type { Prisma } from "@/generated/prisma/client";
import { requireUserId } from "@/lib/session";
import { parseDateInput } from "@/lib/format";

const PAGE_SIZE = 30;

export default async function CaixaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const userId = await requireUserId();
  const params = await searchParams;

  const where: Prisma.TransactionWhereInput = { userId };
  if (params.type === "ENTRADA" || params.type === "SAIDA") {
    where.type = params.type;
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params.from || params.to) {
    where.date = {};
    if (params.from) where.date.gte = parseDateInput(params.from);
    if (params.to) {
      const to = parseDateInput(params.to);
      where.date.lt = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    }
  }

  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;

  // Totais do período são somados no próprio Postgres (via groupBy) em vez
  // de reduzir sobre a lista carregada — a lista agora só traz uma página
  // por vez, e o total precisa continuar refletindo o período inteiro.
  const [transactions, categories, totalCount, totalsByType] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { date: "desc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["type"], where, _sum: { amount: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totalEntradas = totalsByType.find((g) => g.type === "ENTRADA")?._sum.amount ?? 0;
  const totalSaidas = totalsByType.find((g) => g.type === "SAIDA")?._sum.amount ?? 0;
  const saldo = totalEntradas - totalSaidas;

  function buildHref(targetPage: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value && key !== "page") search.set(key, value);
    }
    if (targetPage > 1) search.set("page", String(targetPage));
    const qs = search.toString();
    return qs ? `/caixa?${qs}` : "/caixa";
  }

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

          {transactions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum lançamento encontrado.
            </p>
          ) : (
            <>
              {/* Cards empilhados em telas pequenas */}
              <div className="space-y-2 sm:hidden">
                {transactions.map((t) => (
                  <div key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {t.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(t.date)}
                        </p>
                      </div>
                      <p
                        className={cn(
                          "shrink-0 text-sm font-semibold tabular-nums",
                          t.type === "ENTRADA" ? "text-[#0ca30c]" : "text-[#d03b3b]"
                        )}
                      >
                        {t.type === "ENTRADA" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: t.category.color }}
                        />
                        {t.category.name}
                      </span>
                      {t.billId ? null : (
                        <div className="flex gap-1">
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
                    </div>
                  </div>
                ))}
              </div>

              {/* Tabela em telas sm e maiores */}
              <div className="hidden overflow-x-auto sm:block">
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
                    {transactions.map((t) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
            </>
          )}
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
