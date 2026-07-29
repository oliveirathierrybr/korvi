import type { Metadata } from "next";
import Link from "next/link";
import { AuthBackground } from "@/components/auth-background";
import { AuthCard } from "@/components/auth-card";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha | Korvi",
};

export default function EsqueciSenhaPage() {
  return (
    <AuthBackground>
      <AuthCard
        title="Esqueceu sua senha?"
        description="Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha."
        footer={
          <>
            Lembrou a senha?{" "}
            <Link
              href="/login"
              className="font-medium text-[#5eead4] hover:underline"
            >
              Voltar para o login
            </Link>
          </>
        }
      >
        <ForgotPasswordForm />
      </AuthCard>
    </AuthBackground>
  );
}
