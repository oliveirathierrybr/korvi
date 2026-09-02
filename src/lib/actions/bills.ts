"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { parseDateInput } from "@/lib/format";
import type { ActionResult } from "@/lib/actions/categories";
import { requireUserId } from "@/lib/session";
import { directionToTransactionType, payBillWithTransaction } from "@/lib/actions/bill-helpers";

const billSchema = z.object({
  direction: z.enum(["PAGAR", "RECEBER"]),
  description: z.string().trim().min(1, "Informe uma descrição.").max(140),
  amount: z.number().positive("Informe um valor maior que zero."),
  contactName: z.string().trim().min(1, "Informe o fornecedor/cliente.").max(80),
  dueDate: z.string().min(1, "Informe o vencimento."),
  categoryId: z.string().min(1, "Selecione uma categoria."),
});

type BillInput = z.infer<typeof billSchema>;

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/caixa");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/contas-a-receber");
  revalidatePath("/relatorios");
}

export async function createBill(input: BillInput): Promise<ActionResult> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  const expectedType = directionToTransactionType(parsed.data.direction);
  if (!category || category.userId !== userId || category.type !== expectedType) {
    return { error: "Categoria inválida para este tipo de conta." };
  }

  await prisma.bill.create({
    data: {
      userId,
      direction: parsed.data.direction,
      description: parsed.data.description,
      amount: parsed.data.amount,
      contactName: parsed.data.contactName,
      dueDate: parseDateInput(parsed.data.dueDate),
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function updateBill(
  id: string,
  input: BillInput
): Promise<ActionResult> {
  const parsed = billSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const userId = await requireUserId();

  const existing = await prisma.bill.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return { error: "Conta não encontrada." };
  }
  if (existing.status === "PAGO") {
    return {
      error: "Reabra a conta antes de editá-la.",
    };
  }

  const category = await prisma.category.findUnique({
    where: { id: parsed.data.categoryId },
  });
  const expectedType = directionToTransactionType(parsed.data.direction);
  if (!category || category.userId !== userId || category.type !== expectedType) {
    return { error: "Categoria inválida para este tipo de conta." };
  }

  await prisma.bill.update({
    where: { id },
    data: {
      direction: parsed.data.direction,
      description: parsed.data.description,
      amount: parsed.data.amount,
      contactName: parsed.data.contactName,
      dueDate: parseDateInput(parsed.data.dueDate),
      categoryId: parsed.data.categoryId,
    },
  });

  revalidateAll();
  return { success: true };
}

export async function deleteBill(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const existing = await prisma.bill.findUnique({
    where: { id },
    include: { transaction: true },
  });
  if (!existing || existing.userId !== userId) {
    return { error: "Conta não encontrada." };
  }

  await prisma.$transaction(async (tx) => {
    if (existing.transaction) {
      await tx.transaction.delete({ where: { id: existing.transaction.id } });
    }
    await tx.bill.delete({ where: { id } });
  });

  revalidateAll();
  return { success: true };
}

export async function markBillPaid(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const bill = await prisma.bill.findUnique({ where: { id } });
  if (!bill || bill.userId !== userId) {
    return { error: "Conta não encontrada." };
  }
  if (bill.status === "PAGO") {
    return { error: "Esta conta já está quitada." };
  }

  await prisma.$transaction(async (tx) => {
    await payBillWithTransaction(tx, { userId, bill });
  });

  revalidateAll();
  return { success: true };
}

export async function reopenBill(id: string): Promise<ActionResult> {
  const userId = await requireUserId();

  const bill = await prisma.bill.findUnique({
    where: { id },
    include: { transaction: true },
  });
  if (!bill || bill.userId !== userId) {
    return { error: "Conta não encontrada." };
  }
  if (bill.status !== "PAGO") {
    return { error: "Esta conta ainda não foi quitada." };
  }

  await prisma.$transaction(async (tx) => {
    if (bill.transaction) {
      await tx.transaction.delete({ where: { id: bill.transaction.id } });
    }
    await tx.bill.update({
      where: { id },
      data: { status: "PENDENTE", paidAt: null },
    });
  });

  revalidateAll();
  return { success: true };
}
