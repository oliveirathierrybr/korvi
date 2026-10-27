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

  // Fluxo de caixa dos últimos 6 meses: em vez de trazer todos os
  // lançamentos do período para somar em JS (o dataset cresce sem limite com
  // o tempo de uso), soma cada mês no próprio Postgres — 6 consultas
  // pequenas e agregadas em vez de uma que traz linha por linha.
  const monthWindows = Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i;
    const start = new Date(monthStart.getFullYear(), monthStart.getMonth() - offset, 1);
    const end = new Date(monthStart.getFullYear(), monthStart.getMonth() - offset + 1, 1);
    return { start, end };
  });

  const [
    entradaAgg,
    saidaAgg,
    monthEntradaAgg,
    monthSaidaAgg,
    monthlyGroups,
    categoryGroups,
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
    Promise.all(
      monthWindows.map(({ start, end }) =>
        prisma.transaction.groupBy({
          by: ["type"],
          where: { userId, date: { gte: start, lt: end } },
          _sum: { amount: true },
        })
      )
    ),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, type: "SAIDA", date: { gte: monthStart, lt: nextMonthStart } },
      _sum: { amount: true },
    }),
    prisma.bill.findMany({
      where: { userId, status: "PENDENTE", dueDate: { lt: in7Days } },
      include: { category: true },
      orderBy: { dueDate: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId },
      take: 6,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { category: true },
    }),
    prisma.category.findMany({ where: { userId } }),
  ]);

  const totalEntradas = entradaAgg._sum.amount ?? 0;
  const totalSaidas = saidaAgg._sum.amount ?? 0;
  const balance = totalEntradas - totalSaidas;
  const monthEntradas = monthEntradaAgg._sum.amount ?? 0;
  const monthSaidas = monthSaidaAgg._sum.amount ?? 0;

  const cashFlow = monthWindows.map(({ start }, i) => {
    const groups = monthlyGroups[i];
    const entrada = groups.find((g) => g.type === "ENTRADA")?._sum.amount ?? 0;
    const saida = groups.find((g) => g.type === "SAIDA")?._sum.amount ?? 0;
    return { month: MONTH_LABELS[start.getMonth()], entrada, saida };
  });

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const expensesByCategory = categoryGroups
    .map((group) => {
      const category = categoryById.get(group.categoryId);
      if (!category) return null;
      return {
        name: category.name,
        color: category.color,
        total: group._sum.amount ?? 0,
      };
    })
    .filter((c): c is { name: string; color: string; total: number } => c !== null)
    .sort((a, b) => b.total - a.total);

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
