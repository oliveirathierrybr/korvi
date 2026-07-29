import type { Metadata } from "next";
import Link from "next/link";
import { AuthBackground } from "@/components/auth-background";
import { AuthCard } from "@/components/auth-card";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar | Korvi",
};

export default function LoginPage() {
  return (
    <AuthBackground>
      <AuthCard
        title="Acesse sua conta"
        description="Entre com seu e-mail e senha para acessar o painel financeiro."
        footer={
          <>
            Ainda não tem uma conta?{" "}
            <Link
              href="/cadastro"
              className="font-medium text-[#5eead4] hover:underline"
            >
              Criar conta da empresa
            </Link>
          </>
        }
      >
        <LoginForm />
      </AuthCard>
    </AuthBackground>
  );
}
