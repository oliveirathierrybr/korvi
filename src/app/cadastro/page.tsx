import type { Metadata } from "next";
import Link from "next/link";
import { AuthBackground } from "@/components/auth-background";
import { AuthCard } from "@/components/auth-card";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Criar conta | Korvi",
};

export default function CadastroPage() {
  return (
    <AuthBackground>
      <AuthCard
        title="Criar conta da empresa"
        description="Preencha os dados abaixo para começar a usar o painel financeiro."
        maxWidth="max-w-lg"
        footer={
          <>
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-[#5eead4] hover:underline"
            >
              Entrar
            </Link>
          </>
        }
      >
        <RegisterForm />
      </AuthCard>
    </AuthBackground>
  );
}
