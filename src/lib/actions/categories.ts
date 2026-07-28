"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Informe um nome.").max(60),
  type: z.enum(["ENTRADA", "SAIDA"]),
  color: z.string().trim().min(1),
});

export type ActionResult = { error?: string; success?: boolean };

export async function createCategory(input: {
  name: string;
  type: "ENTRADA" | "SAIDA";
  color: string;
}): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const existing = await prisma.category.findUnique({
    where: {
      name_type: { name: parsed.data.name, type: parsed.data.type },
    },
  });
  if (existing) {
    return { error: "Já existe uma categoria com esse nome e tipo." };
  }

  await prisma.category.create({ data: parsed.data });
  revalidatePath("/categorias");
  revalidatePath("/caixa");
  revalidatePath("/contas-a-pagar");
  revalidatePath("/contas-a-receber");
  return { success: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const inUse = await prisma.transaction.findFirst({
    where: { categoryId: id },
    select: { id: true },
  });
  const inUseBill = await prisma.bill.findFirst({
    where: { categoryId: id },
    select: { id: true },
  });
  if (inUse || inUseBill) {
    return {
      error:
        "Esta categoria está em uso em lançamentos ou contas e não pode ser excluída.",
    };
  }

  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
  return { success: true };
}
