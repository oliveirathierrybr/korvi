"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/format";
import type { ActionResult } from "@/lib/actions/categories";
import { requireUserId } from "@/lib/session";

const transactionSchema = z.object({
  type: z.enum(["ENTRADA", "SAIDA"]),
  amount: z.number().positive("Informe um valor maior que zero."),
  description: z.string().trim().min(1, "Informe uma descrição.").max(140),
  date: z.string().min(1, "Informe uma data."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

type TransactionInput = z.infer<typeof transactionSchema>;

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/caixa");
  revalidatePath("/relatorios");
}

export async function createTransaction(
  input: TransactionInput
): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category || category.userId !== userId || category.type !== parsed.data.type) {
    return { error: "Categoria inválida para este tipo de lançamento." };
  }

  await prisma.transaction.create({
    data: {
      userId,
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      date: parseDateInput(parsed.data.date),
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput
): Promise<ActionResult> {
  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return { error: "Lançamento não encontrado." };
  }
  if (existing.billId) {
    return {
      error:
        "Este lançamento veio da baixa de uma conta e não pode ser editado diretamente.",
    };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  if (!category || category.userId !== userId || category.type !== parsed.data.type) {
    return { error: "Categoria inválida para este tipo de lançamento." };
  }

  await prisma.transaction.update({
    where: { id },
    data: {
      type: parsed.data.type,
      amount: parsed.data.amount,
      description: parsed.data.description,
      date: parseDateInput(parsed.data.date),
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return { error: "Lançamento não encontrado." };
  }
  if (existing.billId) {
    return {
      error:
        "Este lançamento veio da baixa de uma conta. Para removê-lo, reabra a conta correspondente.",
    };
  }

  await prisma.transaction.delete({ where: { id } });
  revalidateAll();
  return { success: true };
}
