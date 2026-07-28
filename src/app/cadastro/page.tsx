import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Criar conta | Fluxo",
};

export default function CadastroPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, white 0, transparent 40%), radial-gradient(circle at 80% 60%, white 0, transparent 35%)",
          }}
        />
        <div className="relative flex items-center gap-2 text-lg font-semibold">
          <Wallet className="h-6 w-6" />
          Fluxo
        </div>
        <div className="relative space-y-4">
          <p className="text-3xl font-semibold leading-tight text-balance">
            Comece a controlar o caixa da sua empresa em menos de um minuto.
          </p>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Crie a conta da sua empresa e já tenha categorias prontas para
            organizar entradas, saídas e contas a pagar e a receber.
          </p>
        </div>
        <p className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} Fluxo. Gestão financeira simples para
          pequenas empresas.
        </p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm space-y-8">
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
