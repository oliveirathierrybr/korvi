import type { Metadata } from "next";
import Link from "next/link";
import { AuthHero } from "@/components/auth-hero";
import { Logo } from "@/components/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Korvi",
};

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthHero
        title="O caixa da sua empresa, sob controle total — sem planilha, sem confusão."
        description="Entradas, saídas, contas a pagar e a receber em um único painel. Feito para quem precisa decidir rápido, com números confiáveis."
      />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center lg:hidden">
              <Logo size={28} wordmarkClassName="text-lg" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Acesse sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seu e-mail e senha para acessar o painel financeiro.
            </p>
          </div>
          <LoginForm />
          <p className="text-center text-sm text-muted-foreground lg:text-left">
            Ainda não tem uma conta?{" "}
            <Link href="/cadastro" className="font-medium text-primary hover:underline">
              Criar conta da empresa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
