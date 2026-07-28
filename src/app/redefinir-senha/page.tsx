import type { Metadata } from "next";
import Link from "next/link";
import { AuthHero } from "@/components/auth-hero";
import { Logo } from "@/components/logo";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Redefinir senha | Korvi",
};

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const token = params.token ?? "";

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthHero
        title="Uma senha nova, o mesmo controle de sempre sobre o seu caixa."
        description="Escolha uma senha forte para manter sua conta protegida."
      />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center lg:hidden">
              <Logo size={28} wordmarkClassName="text-lg" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Criar nova senha
            </h1>
            <p className="text-sm text-muted-foreground">
              Escolha uma nova senha para acessar sua conta.
            </p>
          </div>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <p className="text-sm text-destructive">
              Link inválido. Solicite uma nova redefinição de senha.
            </p>
          )}
          <p className="text-center text-sm text-muted-foreground lg:text-left">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
