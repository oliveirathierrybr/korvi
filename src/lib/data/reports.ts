import { prisma } from "@/lib/prisma";

const MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export async function getReportsData(
  userId: string,
  range: { from?: Date; to?: Date }
) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const from = range.from ?? defaultFrom;
  const to = range.to ?? now;
  const toExclusive = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: from, lt: toExclusive } },
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const monthlyMap = new Map<string, { entrada: number; saida: number }>();
  const cursor = startOfMonth(from);
  const end = startOfMonth(to);
  while (cursor <= end) {
    monthlyMap.set(`${cursor.getFullYear()}-${cursor.getMonth()}`, {
      entrada: 0,
      saida: 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const entradaCategoryTotals = new Map<
    string,
    { name: string; color: string; total: number }
  >();
  const saidaCategoryTotals = new Map<
    string,
    { name: string; color: string; total: number }
  >();

  let totalEntradas = 0;
  let totalSaidas = 0;

  for (const tx of transactions) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
    const bucket = monthlyMap.get(key);
    const map = tx.type === "ENTRADA" ? entradaCategoryTotals : saidaCategoryTotals;
    const existing = map.get(tx.categoryId);
    if (existing) {
      existing.total += tx.amount;
    } else {
      map.set(tx.categoryId, {
        name: tx.category.name,
        color: tx.category.color,
        total: tx.amount,
      });
    }

    if (tx.type === "ENTRADA") {
      totalEntradas += tx.amount;
      if (bucket) bucket.entrada += tx.amount;
    } else {
      totalSaidas += tx.amount;
      if (bucket) bucket.saida += tx.amount;
    }
  }

  const monthly = Array.from(monthlyMap.entries()).map(([key, value]) => {
    const [, monthIndex] = key.split("-").map(Number);
    return {
      month: MONTH_LABELS[monthIndex],
      entrada: value.entrada,
      saida: value.saida,
    };
  });

  return {
    from,
    to,
    monthly,
    entradasByCategory: Array.from(entradaCategoryTotals.values()).sort(
      (a, b) => b.total - a.total
    ),
    saidasByCategory: Array.from(saidaCategoryTotals.values()).sort(
      (a, b) => b.total - a.total
    ),
    totalEntradas,
    totalSaidas,
    resultado: totalEntradas - totalSaidas,
    transactionCount: transactions.length,
  };
}
