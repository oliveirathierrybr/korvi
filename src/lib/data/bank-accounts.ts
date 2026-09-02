import { prisma } from "@/lib/prisma";

/**
 * Agregação para a área "Contas bancárias" — segue o mesmo padrão de
 * src/lib/data/dashboard.ts (arquivo dedicado, não inline na página) porque
 * precisa consolidar saldo entre múltiplas contas/bancos, igual o dashboard
 * consolida entre múltiplas categorias/meses.
 */
export async function getBankAccountsOverview(userId: string) {
  const [accounts, pendingReconciliation, recentBankTransactions] = await Promise.all([
    prisma.bankAccount.findMany({
      where: { userId },
      include: { consent: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bankTransaction.findMany({
      where: { userId, status: "PENDENTE" },
      include: { bankAccount: true, category: true },
      orderBy: { transactionDate: "desc" },
      take: 30,
    }),
    prisma.bankTransaction.findMany({
      where: { userId },
      include: { bankAccount: true, category: true },
      orderBy: { transactionDate: "desc" },
      take: 8,
    }),
  ]);

  const consolidatedBalance = accounts
    .filter((a) => a.connectionStatus !== "DESCONECTADA")
    .reduce((sum, a) => sum + a.balance, 0);

  return {
    accounts,
    consolidatedBalance,
    pendingReconciliation,
    recentBankTransactions,
  };
}

/** Contas a pagar/receber PENDENTE do usuário — usado no picker de "Vincular a conta". */
export async function getOpenBillsForLinking(userId: string) {
  return prisma.bill.findMany({
    where: { userId, status: "PENDENTE" },
    orderBy: { dueDate: "asc" },
  });
}
