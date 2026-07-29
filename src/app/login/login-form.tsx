"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthInput } from "@/components/auth-input";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <AuthInput
          icon={Mail}
          id="email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Senha</Label>
          <Link
            href="/esqueci-senha"
            className="text-xs font-medium text-primary hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
        <AuthInput
          icon={Lock}
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="h-11 w-full rounded-lg" disabled={isPending}>
        {isPending ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
