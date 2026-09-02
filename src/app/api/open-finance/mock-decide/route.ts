import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getBankProvider } from "@/lib/bank/get-bank-provider";
import { isAllowedRedirectUri, resolveRedirectUri } from "@/lib/bank/callback-url";

/**
 * Endpoint só do MockBankProvider — a tela simulada de autorização
 * (/open-finance-mock/[consentId]) usa um link simples (GET) para cá em vez
 * de uma Server Action, deliberadamente: uma Server Action com `redirect()`
 * para uma URL absoluta fora do fluxo de RSC acaba sendo reenviada como POST
 * pelo runtime de Server Actions do Next quando disparada por um <form>,
 * o que quebra contra um Route Handler que só aceita GET. Um link comum
 * evita essa ambiguidade — e também é mais fiel ao que um redirecionamento
 * de verdade para fora do app parece.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const provider = getBankProvider();
  if (provider.providerName !== "mock") {
    return NextResponse.redirect(
      new URL("/contas-bancarias?bankError=Ambiente+simulado+indispon%C3%ADvel.", request.url)
    );
  }

  const params = request.nextUrl.searchParams;
  const consentId = params.get("consentId");
  const state = params.get("state");
  const redirectUri = params.get("redirectUri");
  const decision = params.get("decision") === "authorised" ? "AUTHORISED" : "REJECTED";

  if (!consentId || !state || !redirectUri) {
    return NextResponse.redirect(new URL("/contas-bancarias?bankError=Par%C3%A2metros+inv%C3%A1lidos.", request.url));
  }

  const consent = await prisma.bankConsent.findUnique({ where: { consentId } });
  if (!consent || consent.userId !== session.userId || consent.state !== state) {
    return NextResponse.redirect(new URL("/contas-bancarias?bankError=Consentimento+inv%C3%A1lido.", request.url));
  }

  // redirectUri chega como parâmetro de URL (ver comentário no topo) — nunca
  // deve ser usado sem validar contra o único valor que este servidor
  // geraria para o fluxo Open Finance, ou vira um open redirect (usuário
  // autenticado poderia trocar o parâmetro para apontar a qualquer host).
  const expectedRedirectUri = await resolveRedirectUri();
  if (!isAllowedRedirectUri(redirectUri, expectedRedirectUri)) {
    return NextResponse.redirect(new URL("/contas-bancarias?bankError=Redirecionamento+inv%C3%A1lido.", request.url));
  }

  await prisma.bankConsent.update({
    where: { id: consent.id },
    data: { status: decision },
  });

  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set("consentId", consentId);
  callbackUrl.searchParams.set("state", state);
  return NextResponse.redirect(callbackUrl);
}
