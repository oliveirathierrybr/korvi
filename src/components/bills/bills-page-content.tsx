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
import { Pagination } from "@/components/pagination";
import { requireUserId } from "@/lib/session";

type Direction = "PAGAR" | "RECEBER";

const PAGE_SIZE = 30;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function BillsPageContent({
  direction,
  searchParams,
}: {
  direction: Direction;
  searchParams?: { page?: string };
}) {
  const userId = await requireUserId();
  const isPagar = direction === "PAGAR";
  const contactLabel = isPagar ? "Fornecedor" : "Cliente";
  const today = startOfToday();

  const requestedPage = Number.parseInt(searchParams?.page ?? "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = { userId, direction };

  // Totais somados no próprio Postgres (groupBy/aggregate) em vez de reduzir
  // sobre a lista inteira — a lista abaixo agora só traz uma página por vez.
  const [bills, categories, totalCount, totalsByStatus, overdueAgg] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: { category: true },
      orderBy: { dueDate: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.category.findMany({
      where: { userId, type: isPagar ? "SAIDA" : "ENTRADA" },
      orderBy: { name: "asc" },
    }),
    prisma.bill.count({ where }),
    prisma.bill.groupBy({ by: ["status"], where, _sum: { amount: true } }),
    prisma.bill.aggregate({
      where: { ...where, status: "PENDENTE", dueDate: { lt: today } },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const totalPending = totalsByStatus.find((g) => g.status === "PENDENTE")?._sum.amount ?? 0;
  const totalPaid = totalsByStatus.find((g) => g.status === "PAGO")?._sum.amount ?? 0;
  const totalOverdue = overdueAgg._sum.amount ?? 0;
  const overdueCount = overdueAgg._count;

  const basePath = isPagar ? "/contas-a-pagar" : "/contas-a-receber";
  function buildHref(targetPage: number) {
    return targetPage > 1 ? `${basePath}?page=${targetPage}` : basePath;
  }

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
          hint={`${overdueCount} conta(s)`}
        />
        <SummaryChip
          label={isPagar ? "Total pago" : "Total recebido"}
          value={totalPaid}
          tone="good"
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          {bills.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {totalCount === 0 ? "Nenhuma conta cadastrada." : "Nenhuma conta nesta página."}
            </p>
          ) : (
            <>
              {/* Cards empilhados em telas pequenas */}
              <div className="space-y-2 sm:hidden">
                {bills.map((b) => {
                  const isOverdue = b.status === "PENDENTE" && b.dueDate < today;
                  return (
                    <div key={b.id} className="rounded-lg border p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {b.description}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {contactLabel}: {b.contactName} · {formatDate(b.dueDate)}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums">
                          {formatCurrency(b.amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <StatusBadge status={b.status} isOverdue={isOverdue} />
                          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                            <span
                              className="h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: b.category.color }}
                            />
                            <span className="truncate">{b.category.name}</span>
                          </span>
                        </div>
                        <div className="flex shrink-0 gap-1">
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
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabela em telas sm e maiores */}
              <div className="hidden overflow-x-auto sm:block">
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
                    {bills.map((b) => {
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
                    })}
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
