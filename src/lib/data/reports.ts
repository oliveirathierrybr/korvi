import { prisma } from "@/lib/prisma";

// Teto de meses agregados por relatório — protege contra alguém digitar um
// intervalo absurdo (ex.: "De" com o ano errado, tipo 2006 em vez de 2026) e
// disparar centenas de consultas paralelas. Também evita repetir o bug de
// fuso horário que motivou remover o date_trunc do Postgres daqui: cada mês
// vira uma consulta agregada num intervalo [início, fim) calculado em JS com
// datas locais (mesma convenção de src/lib/format.ts), nunca truncando data
// dentro do Postgres e reinterpretando o resultado como Date local — foi
// assim que a primeira versão desta função bucketizava um lançamento de
// agosto como "Jul" (ver getDashboardData, que já usava esse padrão).
const MAX_REPORT_MONTHS = 36;

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

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export async function getReportsData(
  userId: string,
  range: { from?: Date; to?: Date }
) {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  let from = range.from ?? defaultFrom;
  const to = range.to ?? now;
  const toExclusive = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);

  // Clampa `from` se o intervalo pedido tiver mais meses que MAX_REPORT_MONTHS
  // (ver comentário no topo do arquivo) — protege contra um intervalo digitado
  // errado virar centenas de consultas paralelas.
  const requestedMonthSpan =
    (startOfMonth(to).getFullYear() - startOfMonth(from).getFullYear()) * 12 +
    (startOfMonth(to).getMonth() - startOfMonth(from).getMonth()) +
    1;
  if (requestedMonthSpan > MAX_REPORT_MONTHS) {
    from = addMonths(startOfMonth(to), -(MAX_REPORT_MONTHS - 1));
  }

  const where = { userId, date: { gte: from, lt: toExclusive } };

  // Cada janela é recortada para dentro de [from, toExclusive) — o primeiro
  // e o último mês do intervalo quase nunca são meses cheios (o usuário pode
  // filtrar a partir de um dia qualquer, e o `to` padrão é "agora", não o
  // fim do mês corrente), e sem esse recorte a soma dos meses no gráfico
  // não bateria com os totais gerais abaixo (que já respeitam esse limite).
  const monthWindows: { start: Date; end: Date }[] = [];
  for (let cursor = startOfMonth(from); cursor <= startOfMonth(to); cursor = addMonths(cursor, 1)) {
    const start = cursor < from ? from : cursor;
    const end = addMonths(cursor, 1);
    monthWindows.push({ start, end: end > toExclusive ? toExclusive : end });
  }

  // Agrega no próprio Postgres em vez de trazer todos os lançamentos do
  // período para somar em JS — o intervalo padrão já é de 12 meses e o
  // usuário pode alargar o filtro à vontade, então o volume de linhas não
  // tem limite superior. Cada mês é sua própria consulta com um intervalo
  // [início, fim) em data local, em vez de um único date_trunc no Postgres —
  // ver comentário de MAX_REPORT_MONTHS sobre o bug que essa troca corrigiu.
  const [monthlyGroups, categoryGroups, totalsGroups, categories, transactionCount] =
    await Promise.all([
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
        by: ["categoryId", "type"],
        where,
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["type"],
        where,
        _sum: { amount: true },
      }),
      prisma.category.findMany({ where: { userId } }),
      prisma.transaction.count({ where }),
    ]);

  const monthly = monthWindows.map(({ start }, i) => {
    const groups = monthlyGroups[i];
    const entrada = groups.find((g) => g.type === "ENTRADA")?._sum.amount ?? 0;
    const saida = groups.find((g) => g.type === "SAIDA")?._sum.amount ?? 0;
    return { month: MONTH_LABELS[start.getMonth()], entrada, saida };
  });

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const entradasByCategory: { name: string; color: string; total: number }[] = [];
  const saidasByCategory: { name: string; color: string; total: number }[] = [];
  for (const group of categoryGroups) {
    const category = categoryById.get(group.categoryId);
    if (!category) continue;
    const entry = { name: category.name, color: category.color, total: group._sum.amount ?? 0 };
    if (group.type === "ENTRADA") entradasByCategory.push(entry);
    else saidasByCategory.push(entry);
  }
  entradasByCategory.sort((a, b) => b.total - a.total);
  saidasByCategory.sort((a, b) => b.total - a.total);

  const totalEntradas =
    totalsGroups.find((g) => g.type === "ENTRADA")?._sum.amount ?? 0;
  const totalSaidas = totalsGroups.find((g) => g.type === "SAIDA")?._sum.amount ?? 0;

  return {
    from,
    to,
    monthly,
    entradasByCategory,
    saidasByCategory,
    totalEntradas,
    totalSaidas,
    resultado: totalEntradas - totalSaidas,
    transactionCount,
  };
}
