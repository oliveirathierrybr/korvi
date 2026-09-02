import { redirect } from "next/navigation";
import { ShieldAlert, Landmark } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OpenFinanceMockPage({
  params,
  searchParams,
}: {
  params: Promise<{ consentId: string }>;
  searchParams: Promise<{ state?: string; redirect?: string }>;
}) {
  const { consentId } = await params;
  const { state, redirect: redirectUri } = await searchParams;
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const consent =
    state && redirectUri
      ? await prisma.bankConsent.findUnique({ where: { consentId } })
      : null;

  const valid =
    consent && consent.userId === session.userId && consent.state === state;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          AMBIENTE SIMULADO — nenhum dado bancário real é usado aqui
        </div>

        <Card>
          <CardHeader className="items-center text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Landmark className="h-6 w-6" />
            </div>
            <CardTitle className="text-lg">
              {valid ? consent!.institutionName : "Autorização indisponível"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            {valid ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Esta é uma simulação da tela de autorização do banco{" "}
                  <strong>{consent!.institutionName}</strong>. Em uma conexão real,
                  você autenticaria e autorizaria diretamente no ambiente oficial da
                  instituição — o Korvi nunca vê sua senha ou credenciais bancárias.
                </p>
                <p className="text-xs text-muted-foreground">
                  O Korvi está solicitando acesso a: saldo, extrato e dados de
                  identificação da conta.
                </p>
                <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="w-full flex-1"
                    nativeButton={false}
                    render={
                      <a
                        href={`/api/open-finance/mock-decide?consentId=${encodeURIComponent(consentId)}&state=${encodeURIComponent(state!)}&redirectUri=${encodeURIComponent(redirectUri!)}&decision=rejected`}
                      />
                    }
                  >
                    Negar
                  </Button>
                  <Button
                    className="w-full flex-1"
                    nativeButton={false}
                    render={
                      <a
                        href={`/api/open-finance/mock-decide?consentId=${encodeURIComponent(consentId)}&state=${encodeURIComponent(state!)}&redirectUri=${encodeURIComponent(redirectUri!)}&decision=authorised`}
                      />
                    }
                  >
                    Autorizar
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Este link de autorização é inválido ou expirou. Volte ao Korvi e
                inicie a conexão bancária novamente.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
