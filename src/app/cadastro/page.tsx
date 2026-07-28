import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { AuthHero } from "@/components/auth-hero";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Criar conta | Fluxo",
};

export default function CadastroPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <AuthHero
        title="Comece a controlar o caixa da sua empresa em menos de um minuto."
        description="Crie a conta da sua empresa e já tenha categorias prontas para organizar entradas, saídas e contas a pagar e a receber."
      />
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <div className="mb-4 flex items-center justify-center gap-2 text-lg font-semibold lg:hidden">
              <Wallet className="h-6 w-6 text-primary" />
              Fluxo
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Criar conta da empresa
            </h1>
            <p className="text-sm text-muted-foreground">
              Preencha os dados abaixo para começar a usar o painel
              financeiro.
            </p>
          </div>
          <RegisterForm />
          <p className="text-center text-sm text-muted-foreground lg:text-left">
            Já tem uma conta?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
