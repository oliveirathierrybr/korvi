// Helpers compartilhados entre src/lib/actions/bills.ts e
// src/lib/actions/bank-accounts.ts. Ficam fora de bills.ts (que tem
// "use server" no topo) porque toda função exportada de um arquivo "use
// server" é tratada como Server Action pelo Next e precisa ser async —
// directionToTransactionType não é.
import type { Prisma } from "@/generated/prisma/client";

export function directionToTransactionType(direction: "PAGAR" | "RECEBER") {
  return direction === "PAGAR" ? "SAIDA" : "ENTRADA";
}

/**
 * Cria o Transaction correspondente à baixa de uma Bill e marca a Bill como
 * PAGO — usado tanto por markBillPaid (baixa manual) quanto pela conciliação
 * bancária (src/lib/actions/bank-accounts.ts, quando o usuário vincula uma
 * movimentação bancária a uma conta a pagar/receber em aberto), para não
 * duplicar essa lógica em dois lugares. `tx` é o client de dentro de um
 * prisma.$transaction — quem chama controla a transação.
 */
export async function payBillWithTransaction(
  tx: Prisma.TransactionClient,
  params: {
    userId: string;
    bill: { id: string; direction: "PAGAR" | "RECEBER"; amount: number; description: string; categoryId: string };
    date?: Date;
    bankTransactionId?: string;
  }
) {
  const type = directionToTransactionType(params.bill.direction);
  const date = params.date ?? new Date();

  const transaction = await tx.transaction.create({
    data: {
      userId: params.userId,
      type,
      amount: params.bill.amount,
      description: params.bill.description,
      date,
      categoryId: params.bill.categoryId,
      bankTransactionId: params.bankTransactionId,
    },
  });
  await tx.bill.update({
    where: { id: params.bill.id },
    data: { status: "PAGO", paidAt: date, transaction: { connect: { id: transaction.id } } },
  });

  return transaction;
}
