import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { checkRateLimit, getClientIp, RATE_LIMIT_MESSAGE } from "@/lib/rate-limit";
import { recordAuditLog } from "@/lib/audit";
import { getBankProvider } from "@/lib/bank/get-bank-provider";
import { BankSyncService } from "@/lib/bank/bank-sync-service";

/**
 * Callback do fluxo de consentimento Open Finance — chamado tanto pelo
 * MockBankProvider (via /open-finance-mock) quanto, futuramente, pelo
 * provedor real. NÃO é protegido por src/proxy.ts (o matcher exclui /api/*,
 * ver src/proxy.ts) — por isso valida sessão, posse e o parâmetro `state`
 * (anti-CSRF) ele mesmo, antes de mutar qualquer coisa.
 */
export async function GET(request: NextRequest) {
  const errorRedirect = (reason: string) =>
    NextResponse.redirect(
      new URL(`/contas-bancarias?bankError=${encodeURIComponent(reason)}`, request.url)
    );

  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const userId = session.userId;

  const ip = await getClientIp();
  const allowed = await checkRateLimit(`open-finance-callback:user:${userId}`, 15, 5 * 60 * 1000);
  const allowedByIp = await checkRateLimit(`open-finance-callback:ip:${ip}`, 30, 5 * 60 * 1000);
  if (!allowed || !allowedByIp) {
    return errorRedirect(RATE_LIMIT_MESSAGE);
  }

  const consentId = request.nextUrl.searchParams.get("consentId");
  const state = request.nextUrl.searchParams.get("state");
  if (!consentId || !state) {
    return errorRedirect("Parâmetros inválidos.");
  }

  const consent = await prisma.bankConsent.findUnique({ where: { consentId } });
  if (!consent || consent.userId !== userId || consent.state !== state) {
    // Não vaza se foi "não encontrado" vs. "não pertence a você" — mesma
    // mensagem genérica nos dois casos.
    return errorRedirect("Consentimento inválido.");
  }

  let provider;
  try {
    provider = getBankProvider();
  } catch {
    return errorRedirect("Conexão bancária não disponível nesta instalação.");
  }

  try {
    const outcome = await provider.getConsentStatus(consent.consentId);

    if (outcome === "REJECTED") {
      await prisma.bankConsent.update({
        where: { id: consent.id },
        data: { status: "REJECTED" },
      });
      await recordAuditLog({
        userId,
        action: "bank_consent_rejected",
        resource: `BankConsent:${consent.consentId}`,
      });
      return NextResponse.redirect(new URL("/contas-bancarias?bankRejected=1", request.url));
    }

    if (outcome !== "AUTHORISED") {
      await prisma.bankConsent.update({
        where: { id: consent.id },
        data: { status: "ERROR" },
      });
      await recordAuditLog({
        userId,
        action: "bank_consent_error",
        resource: `BankConsent:${consent.consentId}`,
      });
      return errorRedirect("Não foi possível concluir a autorização.");
    }

    await prisma.bankConsent.update({
      where: { id: consent.id },
      data: { status: "AUTHORISED" },
    });
    await recordAuditLog({
      userId,
      action: "bank_consent_authorised",
      resource: `BankConsent:${consent.consentId}`,
    });

    // Idempotência: se o callback for acionado mais de uma vez para o mesmo
    // consentimento (ex.: usuário voltou e recarregou), não duplica contas.
    const existingAccounts = await prisma.bankAccount.findMany({
      where: { consentId: consent.id },
    });

    let accountIds = existingAccounts.map((a) => a.id);
    if (existingAccounts.length === 0) {
      const remoteAccounts = await provider.fetchAccounts(consent.consentId);
      const created = await Promise.all(
        remoteAccounts.map((remote) =>
          prisma.bankAccount.create({
            data: {
              userId,
              consentId: consent.id,
              institutionId: consent.institutionId,
              institutionName: consent.institutionName,
              accountType: remote.accountType,
              accountNumberMasked: remote.numberMasked,
              branchMasked: remote.branchMasked,
              currency: remote.currency,
              balance: remote.balance,
              balanceUpdatedAt: new Date(),
            },
          })
        )
      );
      accountIds = created.map((a) => a.id);
      await recordAuditLog({
        userId,
        action: "bank_account_connected",
        resource: `BankConsent:${consent.consentId}`,
        metadata: { accounts: accountIds.length },
      });
    }

    const syncService = new BankSyncService(provider);
    await Promise.allSettled(accountIds.map((id) => syncService.syncAccount(id, userId)));

    return NextResponse.redirect(new URL("/contas-bancarias?bankConnected=1", request.url));
  } catch (err) {
    console.error("open-finance callback failed:", err);
    return errorRedirect("Não foi possível concluir a conexão bancária.");
  }
}
