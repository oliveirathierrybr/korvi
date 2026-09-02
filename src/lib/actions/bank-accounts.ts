"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";
import { getBankProvider } from "@/lib/bank/get-bank-provider";
import { resolveRedirectUri } from "@/lib/bank/callback-url";
import { BankSyncService } from "@/lib/bank/bank-sync-service";
import { learnCategoryRule } from "@/lib/bank/categorization";
import { payBillWithTransaction } from "@/lib/actions/bill-helpers";
import type { ActionResult } from "@/lib/actions/categories";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/contas-bancarias");
  revalidatePath("/caixa");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/contas-a-receber");
  revalidatePath("/relatorios");
}

function bankIntegrationUnavailable(): { error: string } {
  return { error: "Conexão bancária não disponível nesta instalação." };
}

const institutionSchema = z.object({
  institutionId: z.string().min(1, "Selecione uma instituição."),
});

export type InitiateBankConnectionResult = { redirectUrl: string } | { error: string };

export async function initiateBankConnection(
  input: z.infer<typeof institutionSchema>
): Promise<InitiateBankConnectionResult> {
  const parsed = institutionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  const ip = await getClientIp();
  const allowed = await checkRateLimit(`bank-connect:user:${userId}`, 5, 10 * 60 * 1000);
  const allowedByIp = await checkRateLimit(`bank-connect:ip:${ip}`, 15, 10 * 60 * 1000);
  if (!allowed || !allowedByIp) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  let provider;
  try {
    provider = getBankProvider();
  } catch {
    return bankIntegrationUnavailable();
  }

  const institutions = await provider.listInstitutions();
  const institution = institutions.find((i) => i.id === parsed.data.institutionId);
  if (!institution) {
    return { error: "Instituição inválida." };
  }

  const redirectUri = await resolveRedirectUri();

  let result;
  try {
    result = await provider.initiateConsent({
      institutionId: institution.id,
      userId,
      redirectUri,
    });
  } catch (err) {
    console.error("initiateBankConnection failed:", err);
    return { error: "Não foi possível iniciar a conexão com o banco. Tente novamente." };
  }

  await prisma.bankConsent.create({
    data: {
      userId,
      provider: provider.providerName,
      institutionId: institution.id,
      institutionName: institution.name,
      consentId: result.consentId,
      state: result.state,
      status: "AWAITING_AUTHORISATION",
      scopes: ["saldo", "extrato", "identificacao"],
    },
  });

  await recordAuditLog({
    userId,
    action: "bank_consent_initiated",
    resource: `BankConsent:${result.consentId}`,
    metadata: { institutionId: institution.id },
  });

  return { redirectUrl: result.redirectUrl };
}

const bankAccountIdSchema = z.object({ bankAccountId: z.string().min(1) });

export async function disconnectBankAccount(bankAccountId: string): Promise<ActionResult> {
  const parsed = bankAccountIdSchema.safeParse({ bankAccountId });
  if (!parsed.success) return { error: "Dados inválidos." };

  const userId = await requireUserId();

  const account = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    include: { consent: true },
  });
  if (!account || account.userId !== userId) {
    return { error: "Conta bancária não encontrada." };
  }

  try {
    const provider = getBankProvider();
    if (provider.providerName === account.consent.provider) {
      await provider.revokeConsent(account.consent.consentId).catch(() => {});
    }
  } catch {
    // Se o provedor não estiver mais configurado, ainda assim deixamos o
    // usuário desconectar localmente — não bloqueia numa ação destrutiva.
  }

  await prisma.$transaction([
    prisma.bankAccount.update({
      where: { id: bankAccountId },
      data: { connectionStatus: "DESCONECTADA" },
    }),
    prisma.bankConsent.update({
      where: { id: account.consentId },
      data: { revokedAt: new Date(), status: "REVOKED" },
    }),
  ]);

  await recordAuditLog({
    userId,
    action: "bank_account_disconnected",
    resource: `BankAccount:${bankAccountId}`,
  });

  revalidateAll();
  return { success: true };
}

export async function syncBankAccount(bankAccountId: string): Promise<ActionResult> {
  const parsed = bankAccountIdSchema.safeParse({ bankAccountId });
  if (!parsed.success) return { error: "Dados inválidos." };

  const userId = await requireUserId();

  const allowed = await checkRateLimit(`bank-sync:user:${userId}`, 10, 5 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  let provider;
  try {
    provider = getBankProvider();
  } catch {
    return bankIntegrationUnavailable();
  }

  try {
    await new BankSyncService(provider).syncAccount(bankAccountId, userId);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível atualizar sua conta. Tente novamente." };
  }

  revalidateAll();
  return { success: true };
}

export async function syncAllBankAccounts(): Promise<ActionResult> {
  const userId = await requireUserId();

  const allowed = await checkRateLimit(`bank-sync:user:${userId}`, 10, 5 * 60 * 1000);
  if (!allowed) {
    return { error: RATE_LIMIT_MESSAGE };
  }

  let provider;
  try {
    provider = getBankProvider();
  } catch {
    return bankIntegrationUnavailable();
  }

  await new BankSyncService(provider).syncAllAccounts(userId);
  revalidateAll();
  return { success: true };
}

const categorizeSchema = z.object({
  bankTransactionId: z.string().min(1),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

export async function categorizeBankTransaction(
  input: z.infer<typeof categorizeSchema>
): Promise<ActionResult> {
  const parsed = categorizeSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const userId = await requireUserId();

  const bankTx = await prisma.bankTransaction.findUnique({
    where: { id: parsed.data.bankTransactionId },
  });
  if (!bankTx || bankTx.userId !== userId) {
    return { error: "Movimentação não encontrada." };
  }

  const expectedType = bankTx.type === "CREDIT" ? "ENTRADA" : "SAIDA";
  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category || category.userId !== userId || category.type !== expectedType) {
    return { error: "Categoria inválida para este tipo de movimentação." };
  }

  await prisma.bankTransaction.update({
    where: { id: bankTx.id },
    data: { categoryId: category.id },
  });
  await learnCategoryRule(userId, bankTx.description, category.id);

  await recordAuditLog({
    userId,
    action: "bank_transaction_categorized",
    resource: `BankTransaction:${bankTx.id}`,
    metadata: { categoryId: category.id },
  });

  revalidateAll();
  return { success: true };
}

const linkBillSchema = z.object({
  bankTransactionId: z.string().min(1),
  billId: z.string().min(1),
});

export async function linkBankTransactionToBill(
  input: z.infer<typeof linkBillSchema>
): Promise<ActionResult> {
  const parsed = linkBillSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const userId = await requireUserId();

  const bankTx = await prisma.bankTransaction.findUnique({
    where: { id: parsed.data.bankTransactionId },
  });
  if (!bankTx || bankTx.userId !== userId) {
    return { error: "Movimentação não encontrada." };
  }
  if (bankTx.status !== "PENDENTE") {
    return { error: "Esta movimentação já foi conciliada ou ignorada." };
  }

  const bill = await prisma.bill.findUnique({ where: { id: parsed.data.billId } });
  if (!bill || bill.userId !== userId) {
    return { error: "Conta não encontrada." };
  }
  if (bill.status !== "PENDENTE") {
    return { error: "Esta conta já está quitada." };
  }

  const expectedDirection = bankTx.type === "DEBIT" ? "PAGAR" : "RECEBER";
  if (bill.direction !== expectedDirection) {
    return { error: "Esta conta não é compatível com o tipo desta movimentação." };
  }

  await prisma.$transaction(async (tx) => {
    await payBillWithTransaction(tx, {
      userId,
      bill,
      date: bankTx.transactionDate,
      bankTransactionId: bankTx.id,
    });
    await tx.bankTransaction.update({
      where: { id: bankTx.id },
      data: { status: "CONCILIADO" },
    });
  });

  await recordAuditLog({
    userId,
    action: "bank_transaction_linked_to_bill",
    resource: `BankTransaction:${bankTx.id}`,
    metadata: { billId: bill.id },
  });

  revalidateAll();
  return { success: true };
}

const createTransactionSchema = z.object({
  bankTransactionId: z.string().min(1),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

export async function createTransactionFromBankTransaction(
  input: z.infer<typeof createTransactionSchema>
): Promise<ActionResult> {
  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }
  const userId = await requireUserId();

  const bankTx = await prisma.bankTransaction.findUnique({
    where: { id: parsed.data.bankTransactionId },
  });
  if (!bankTx || bankTx.userId !== userId) {
    return { error: "Movimentação não encontrada." };
  }
  if (bankTx.status !== "PENDENTE") {
    return { error: "Esta movimentação já foi conciliada ou ignorada." };
  }

  const expectedType = bankTx.type === "CREDIT" ? "ENTRADA" : "SAIDA";
  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category || category.userId !== userId || category.type !== expectedType) {
    return { error: "Categoria inválida para este tipo de movimentação." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        userId,
        type: expectedType,
        amount: bankTx.amount,
        description: bankTx.description,
        date: bankTx.transactionDate,
        categoryId: category.id,
        bankTransactionId: bankTx.id,
      },
    });
    await tx.bankTransaction.update({
      where: { id: bankTx.id },
      data: { status: "CONCILIADO", categoryId: category.id },
    });
  });

  await recordAuditLog({
    userId,
    action: "bank_transaction_converted_to_ledger",
    resource: `BankTransaction:${bankTx.id}`,
  });

  revalidateAll();
  return { success: true };
}

export async function ignoreBankTransaction(bankTransactionId: string): Promise<ActionResult> {
  const parsed = bankAccountIdSchema.safeParse({ bankAccountId: bankTransactionId });
  if (!parsed.success) return { error: "Dados inválidos." };

  const userId = await requireUserId();

  const bankTx = await prisma.bankTransaction.findUnique({ where: { id: bankTransactionId } });
  if (!bankTx || bankTx.userId !== userId) {
    return { error: "Movimentação não encontrada." };
  }
  if (bankTx.status !== "PENDENTE") {
    return { error: "Esta movimentação já foi conciliada ou ignorada." };
  }

  await prisma.bankTransaction.update({
    where: { id: bankTransactionId },
    data: { status: "IGNORADO" },
  });

  await recordAuditLog({
    userId,
    action: "bank_transaction_ignored",
    resource: `BankTransaction:${bankTransactionId}`,
  });

  revalidateAll();
  return { success: true };
}
