import type { Metadata } from "next";
import Link from "next/link";
import { AuthBackground } from "@/components/auth-background";
import { AuthCard } from "@/components/auth-card";
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
    <AuthBackground>
      <AuthCard
        title="Criar nova senha"
        description="Escolha uma nova senha para acessar sua conta."
        footer={
          <Link
            href="/login"
            className="font-medium text-[#5eead4] hover:underline"
          >
            Voltar para o login
          </Link>
        }
      >
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="text-sm text-destructive">
            Link inválido. Solicite uma nova redefinição de senha.
          </p>
        )}
      </AuthCard>
    </AuthBackground>
  );
}
