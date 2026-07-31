import { prisma } from "@/lib/prisma";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

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

export async function getDashboardData(userId: string) {
  const today = startOfDay(new Date());
  const in7Days = new Date(today);
  in7Days.setDate(in7Days.getDate() + 7);
  const monthStart = startOfMonth(today);
  const nextMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const sixMonthsAgoStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 5, 1);

  const [
    entradaAgg,
    saidaAgg,
    monthEntradaAgg,
    monthSaidaAgg,
    sixMonthTx,
    upcomingBills,
    recentTx,
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
      where: { userId, date: { gte: sixMonthsAgoStart } },
      select: { type: true, amount: true, date: true, categoryId: true },
    }),
    prisma.bill.findMany({
      where: { userId, status: "PENDENTE", dueDate: { lt: in7Days } },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId },
      take: 6,
      orderBy: { date: "desc" },
      include: { category: true },
    }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  const totalEntradas = entradaAgg._sum.amount ?? 0;
  const totalSaidas = saidaAgg._sum.amount ?? 0;
  const balance = totalEntradas - totalSaidas;
  const monthEntradas = monthEntradaAgg._sum.amount ?? 0;
  const monthSaidas = monthSaidaAgg._sum.amount ?? 0;

  const monthlyMap = new Map<string, { entrada: number; saida: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(monthStart.getFullYear(), monthStart.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyMap.set(key, { entrada: 0, saida: 0 });
  }
  for (const tx of sixMonthTx) {
    const key = `${tx.date.getFullYear()}-${tx.date.getMonth()}`;
    const bucket = monthlyMap.get(key);
    if (!bucket) continue;
    if (tx.type === "ENTRADA") bucket.entrada += tx.amount;
    else bucket.saida += tx.amount;
  }
  const cashFlow = Array.from(monthlyMap.entries()).map(([key, value]) => {
    const [, monthIndex] = key.split("-").map(Number);
    return {
      month: MONTH_LABELS[monthIndex],
      entrada: value.entrada,
      saida: value.saida,
    };
  });

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const categoryTotals = new Map<
    string,
    { name: string; color: string; total: number }
  >();

  for (const tx of sixMonthTx) {
    if (tx.type !== "SAIDA" || tx.date < monthStart || tx.date >= nextMonthStart) {
      continue;
    }
    const category = categoryById.get(tx.categoryId);
    if (!category) continue;
    const existing = categoryTotals.get(tx.categoryId);
    if (existing) {
      existing.total += tx.amount;
    } else {
      categoryTotals.set(tx.categoryId, {
        name: category.name,
        color: category.color,
        total: tx.amount,
      });
    }
  }
  const expensesByCategory = Array.from(categoryTotals.values()).sort(
    (a, b) => b.total - a.total
  );

  const overdueBills = upcomingBills.filter((b) => b.dueDate < today);
  const dueSoonBills = upcomingBills.filter((b) => b.dueDate >= today);

  return {
    balance,
    monthEntradas,
    monthSaidas,
    monthResult: monthEntradas - monthSaidas,
    cashFlow,
    expensesByCategory,
    overdueBills,
    dueSoonBills,
    recentTransactions: recentTx,
  };
}
