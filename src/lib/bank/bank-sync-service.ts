import "server-only";
import { prisma } from "@/lib/prisma";
import { recordAuditLog } from "@/lib/audit";
import { suggestCategoryId } from "@/lib/bank/categorization";
import { pickReconciliationMatch } from "@/lib/bank/reconciliation";
import type { BankIntegrationService } from "@/lib/bank/bank-integration-service";

const RECONCILIATION_WINDOW_DAYS = 2;

function synthesizeExternalId(params: {
  bankAccountId: string;
  date: Date;
  amount: number;
  description: string;
}) {
  // Fallback só usado quando o provedor não devolve um id definitivo (ex.:
  // lançamento ainda "pendente"). Prefixado para nunca ser confundido com um
  // id real de duplicata legítima.
  const raw = `${params.bankAccountId}|${params.date.toISOString()}|${params.amount}|${params.description}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    hash = (hash * 31 + raw.charCodeAt(i)) | 0;
  }
  return `synthetic:${Math.abs(hash)}`;
}

/**
 * Orquestra: buscar saldo + movimentações novas de cada conta conectada,
 * gravar de forma idempotente, sugerir categoria, tentar conciliar
 * automaticamente com lançamentos manuais já existentes, e atualizar
 * timestamps de sincronização. Nunca expõe detalhe técnico ao usuário final
 * — quem chama esta classe é responsável por traduzir erros numa mensagem
 * genérica.
 */
export class BankSyncService {
  constructor(private readonly provider: BankIntegrationService) {}

  async syncAccount(bankAccountId: string, userId: string) {
    const account = await prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      include: { consent: true },
    });
    if (!account || account.userId !== userId) {
      throw new Error("Conta bancária não encontrada.");
    }

    try {
      const [remoteAccount] = await this.provider.fetchAccounts(account.consent.consentId);
      const remoteTransactions = await this.provider.fetchTransactions({
        consentId: account.consent.consentId,
        externalAccountId: remoteAccount?.externalAccountId ?? account.id,
        since: account.consent.lastSyncAt ?? undefined,
      });

      const rows = remoteTransactions.map((tx) => ({
        userId,
        bankAccountId: account.id,
        externalTransactionId:
          tx.externalTransactionId ??
          synthesizeExternalId({
            bankAccountId: account.id,
            date: tx.date,
            amount: tx.amount,
            description: tx.description,
          }),
        transactionDate: tx.date,
        description: tx.description,
        amount: Math.abs(tx.amount),
        type: tx.type,
        rawReference: tx.raw ? JSON.parse(JSON.stringify(tx.raw)) : undefined,
      }));

      if (rows.length > 0) {
        await prisma.bankTransaction.createMany({
          data: rows,
          skipDuplicates: true,
        });
      }

      const insertedRows = await prisma.bankTransaction.findMany({
        where: {
          bankAccountId: account.id,
          externalTransactionId: { in: rows.map((r) => r.externalTransactionId) },
          status: "PENDENTE",
        },
      });

      for (const bankTx of insertedRows) {
        const categoryId = await suggestCategoryId(userId, bankTx.description);
        if (categoryId && !bankTx.categoryId) {
          await prisma.bankTransaction.update({
            where: { id: bankTx.id },
            data: { categoryId },
          });
        }
        await this.tryAutoReconcile(bankTx.id, userId);
      }

      const now = new Date();
      await prisma.$transaction([
        prisma.bankAccount.update({
          where: { id: account.id },
          data: {
            balance: remoteAccount?.balance ?? account.balance,
            balanceUpdatedAt: now,
            connectionStatus: "ATIVA",
          },
        }),
        prisma.bankConsent.update({
          where: { id: account.consentId },
          data: { lastSyncAt: now },
        }),
      ]);

      await recordAuditLog({
        userId,
        action: "bank_sync_completed",
        resource: `BankAccount:${account.id}`,
        metadata: { transactionsFetched: rows.length },
      });

      return { syncedTransactions: rows.length };
    } catch (err) {
      await prisma.bankAccount.update({
        where: { id: account.id },
        data: { connectionStatus: "ERRO" },
      });
      await recordAuditLog({
        userId,
        action: "bank_sync_error",
        resource: `BankAccount:${account.id}`,
        metadata: { message: err instanceof Error ? err.message : "erro desconhecido" },
      });
      throw new Error("Não foi possível atualizar sua conta. Tente novamente.");
    }
  }

  async syncAllAccounts(userId: string) {
    const accounts = await prisma.bankAccount.findMany({
      where: { userId, connectionStatus: { not: "DESCONECTADA" } },
    });
    const results = await Promise.allSettled(
      accounts.map((account) => this.syncAccount(account.id, userId))
    );
    const failures = results.filter((r) => r.status === "rejected").length;
    return { total: accounts.length, failures };
  }

  /**
   * Só roda sobre uma BankTransaction recém-avaliada (PENDENTE) — nunca
   * reavalia linhas já CONCILIADO. Critério: mesmo userId, sinal compatível
   * (CREDIT↔ENTRADA, DEBIT↔SAIDA), mesmo valor, data dentro de ±2 dias, sem
   * vínculo já feito de nenhum dos dois lados. Em caso de mais de uma
   * candidata, escolhe a de data mais próxima; se ainda empatar, não casa
   * automaticamente — fica pendente para o usuário decidir (errar um
   * casamento automático é pior do que não casar).
   */
  private async tryAutoReconcile(bankTransactionId: string, userId: string) {
    const bankTx = await prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });
    if (!bankTx || bankTx.status !== "PENDENTE") return;

    const expectedType = bankTx.type === "CREDIT" ? "ENTRADA" : "SAIDA";
    const windowStart = new Date(bankTx.transactionDate);
    windowStart.setDate(windowStart.getDate() - RECONCILIATION_WINDOW_DAYS);
    const windowEnd = new Date(bankTx.transactionDate);
    windowEnd.setDate(windowEnd.getDate() + RECONCILIATION_WINDOW_DAYS);

    const candidates = await prisma.transaction.findMany({
      where: {
        userId,
        type: expectedType,
        amount: bankTx.amount,
        bankTransactionId: null,
        date: { gte: windowStart, lte: windowEnd },
      },
    });

    if (candidates.length === 0) return;

    const match = pickReconciliationMatch(candidates, bankTx.transactionDate);
    if (!match) {
      // Nenhuma candidata única mais próxima (empate) — não arrisca casar
      // errado, deixa para revisão manual. Ver pickReconciliationMatch.
      return;
    }

    await prisma.$transaction([
      prisma.transaction.update({
        where: { id: match.id },
        data: { bankTransactionId: bankTx.id },
      }),
      prisma.bankTransaction.update({
        where: { id: bankTx.id },
        data: { status: "CONCILIADO" },
      }),
    ]);
  }
}
