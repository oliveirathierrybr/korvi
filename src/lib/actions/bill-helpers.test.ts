import { describe, expect, it, vi } from "vitest";
import { directionToTransactionType, payBillWithTransaction } from "@/lib/actions/bill-helpers";
import type { Prisma } from "@/generated/prisma/client";

describe("directionToTransactionType", () => {
  it("maps PAGAR to SAIDA", () => {
    expect(directionToTransactionType("PAGAR")).toBe("SAIDA");
  });

  it("maps RECEBER to ENTRADA", () => {
    expect(directionToTransactionType("RECEBER")).toBe("ENTRADA");
  });
});

describe("payBillWithTransaction", () => {
  const bill = {
    id: "bill-1",
    direction: "PAGAR" as const,
    amount: 150.5,
    description: "Conta de luz",
    categoryId: "cat-1",
  };

  it("creates a SAIDA transaction with the bill's data and marks the bill PAGO", async () => {
    const createdTransaction = { id: "tx-1" };
    const create = vi.fn().mockResolvedValue(createdTransaction);
    const billUpdate = vi.fn().mockResolvedValue({});
    const tx = {
      transaction: { create },
      bill: { update: billUpdate },
    } as unknown as Prisma.TransactionClient;

    const fixedDate = new Date("2026-08-10T00:00:00");
    const result = await payBillWithTransaction(tx, {
      userId: "user-1",
      bill,
      date: fixedDate,
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        type: "SAIDA",
        amount: bill.amount,
        description: bill.description,
        date: fixedDate,
        categoryId: bill.categoryId,
        bankTransactionId: undefined,
      }),
    });
    expect(billUpdate).toHaveBeenCalledWith({
      where: { id: bill.id },
      data: { status: "PAGO", paidAt: fixedDate, transaction: { connect: { id: "tx-1" } } },
    });
    expect(result).toBe(createdTransaction);
  });

  it("defaults the date to now when not provided", async () => {
    const before = Date.now();
    const create = vi.fn().mockResolvedValue({ id: "tx-2" });
    const tx = {
      transaction: { create },
      bill: { update: vi.fn().mockResolvedValue({}) },
    } as unknown as Prisma.TransactionClient;

    await payBillWithTransaction(tx, { userId: "user-1", bill });

    const usedDate = create.mock.calls[0][0].data.date as Date;
    expect(usedDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(usedDate.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it("passes through the bankTransactionId when reconciling a bank transaction", async () => {
    const create = vi.fn().mockResolvedValue({ id: "tx-3" });
    const tx = {
      transaction: { create },
      bill: { update: vi.fn().mockResolvedValue({}) },
    } as unknown as Prisma.TransactionClient;

    await payBillWithTransaction(tx, {
      userId: "user-1",
      bill: { ...bill, direction: "RECEBER" },
      bankTransactionId: "banktx-1",
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: "ENTRADA", bankTransactionId: "banktx-1" }),
    });
  });
});
