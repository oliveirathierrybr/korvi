import type { Metadata } from "next";
import Link from "next/link";
import { AuthHero } from "@/components/auth-hero";
import { Logo } from "@/components/logo";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Esqueci minha senha | Korvi",
};

export default function EsqueciSenhaPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthHero
        title="Sem estresse. Em poucos passos você volta a acessar sua conta."
        description="Enviamos um link seguro para o seu e-mail cadastrado, válido por 1 hora."
      />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center lg:hidden">
              <Logo size={28} wordmarkClassName="text-lg" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Esqueceu sua senha?
            </h1>
            <p className="text-sm text-muted-foreground">
              Informe o e-mail da sua conta e enviaremos um link para você
              criar uma nova senha.
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="text-center text-sm text-muted-foreground lg:text-left">
            Lembrou a senha?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Voltar para o login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
