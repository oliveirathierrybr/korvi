import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Fluxo",
};

export default function LoginPage() {
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
            O caixa da sua empresa, sob controle total — sem planilha, sem
            confusão.
          </p>
          <p className="max-w-md text-sm text-primary-foreground/80">
            Entradas, saídas, contas a pagar e a receber em um único painel.
            Feito para quem precisa decidir rápido, com números confiáveis.
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
              Acesse sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com seu e-mail e senha para acessar o painel financeiro.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
