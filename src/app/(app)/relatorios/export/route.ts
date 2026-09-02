import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { formatDate, parseDateInput } from "@/lib/format";
import { toCsvRow } from "@/lib/csv";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const where: { userId: string; date?: { gte?: Date; lt?: Date } } = {
    userId: session.userId,
  };
  if (fromParam || toParam) {
    where.date = {};
    if (fromParam) where.date.gte = parseDateInput(fromParam);
    if (toParam) {
      const to = parseDateInput(toParam);
      where.date.lt = new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
    }
  }

  const transactions = await prisma.transaction.findMany({
    where,
    include: { category: true },
    orderBy: { date: "asc" },
  });

  const header = ["Data", "Tipo", "Descrição", "Categoria", "Valor (R$)"];
  const rows = transactions.map((t) =>
    toCsvRow([
      formatDate(t.date),
      t.type === "ENTRADA" ? "Entrada" : "Saída",
      t.description,
      t.category.name,
      t.amount.toFixed(2).replace(".", ","),
    ])
  );

  const csv = "﻿" + [toCsvRow(header), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="caixa.csv"`,
    },
  });
}
