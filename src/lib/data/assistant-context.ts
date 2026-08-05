import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate } from "@/lib/format";

/**
 * Builds a compact, text-based summary of the user's financial data to use
 * as context for the AI assistant. Kept deliberately small (recent window +
 * aggregates, not a full data dump) to control token usage and latency.
 *
 * Everything here is scoped by userId — this is the only data the assistant
 * ever sees, so it must never mix data across accounts/companies.
 */
export async function buildFinancialContext(userId: string): Promise<string> {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);

  const [
    totalEntradasAgg,
    totalSaidasAgg,
    monthEntradasAgg,
    monthSaidasAgg,
    recentTransactions,
    pendingBills,
    categories,
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, type: "ENTRADA" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "SAIDA" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "ENTRADA", date: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: "SAIDA", date: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, date: { gte: ninetyDaysAgo } },
      include: { category: true },
      orderBy: { date: "desc" },
      take: 60,
    }),
    prisma.bill.findMany({
      where: { userId, status: "PENDENTE" },
      include: { category: true },
      orderBy: { dueDate: "asc" },
      take: 30,
    }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  const balance =
    (totalEntradasAgg._sum.amount ?? 0) - (totalSaidasAgg._sum.amount ?? 0);
  const monthEntradas = monthEntradasAgg._sum.amount ?? 0;
  const monthSaidas = monthSaidasAgg._sum.amount ?? 0;

  const lines: string[] = [];
  lines.push(`Data de hoje: ${formatDate(today)}`);
  lines.push(`Saldo atual (histórico completo): ${formatCurrency(balance)}`);
  lines.push(
    `Entradas do mês atual: ${formatCurrency(monthEntradas)} | Saídas do mês atual: ${formatCurrency(monthSaidas)} | Resultado do mês: ${formatCurrency(monthEntradas - monthSaidas)}`
  );

  lines.push("");
  lines.push(`Categorias cadastradas: ${categories.map((c) => `${c.name} (${c.type})`).join(", ") || "nenhuma"}`);

  lines.push("");
  const overdue = pendingBills.filter((b) => b.dueDate < today);
  const dueSoon = pendingBills.filter((b) => b.dueDate >= today && b.dueDate < in7Days);
  lines.push(`Contas pendentes: ${pendingBills.length} (${overdue.length} vencida(s), ${dueSoon.length} vencendo em 7 dias)`);
  if (pendingBills.length > 0) {
    lines.push("Lista de contas pendentes (vencimento | direção | descrição | contato | categoria | valor):");
    for (const b of pendingBills) {
      lines.push(
        `- ${formatDate(b.dueDate)} | ${b.direction} | ${b.description} | ${b.contactName} | ${b.category.name} | ${formatCurrency(b.amount)}`
      );
    }
  }

  lines.push("");
  lines.push(`Lançamentos dos últimos 90 dias (mais recentes primeiro, até 60 registros; data | tipo | categoria | valor | descrição):`);
  if (recentTransactions.length === 0) {
    lines.push("(nenhum lançamento neste período)");
  } else {
    for (const t of recentTransactions) {
      lines.push(
        `- ${formatDate(t.date)} | ${t.type} | ${t.category.name} | ${formatCurrency(t.amount)} | ${t.description}`
      );
    }
  }

  return lines.join("\n");
}
