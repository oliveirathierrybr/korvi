"use client";

import { useActionState, useState } from "react";
import { Building2, IdCard, User, Mail, Lock } from "lucide-react";
import { registerAction, type RegisterState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthInput } from "@/components/auth-input";
import { formatCnpj } from "@/lib/cnpj";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(
    registerAction,
    initialState
  );
  const [cnpj, setCnpj] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nome da empresa</Label>
          <AuthInput
            icon={Building2}
            id="companyName"
            name="companyName"
            placeholder="Minha Empresa Ltda"
            autoComplete="organization"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cnpj">CNPJ</Label>
          <AuthInput
            icon={IdCard}
            id="cnpj"
            name="cnpj"
            value={cnpj}
            onChange={(e) => setCnpj(formatCnpj(e.target.value))}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            maxLength={18}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Seu nome</Label>
        <AuthInput
          icon={User}
          id="name"
          name="name"
          placeholder="Seu nome completo"
          autoComplete="name"
          required
        />
      </div>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <AuthInput
            icon={Lock}
            id="password"
            name="password"
            type="password"
            placeholder="Pelo menos 6 caracteres"
            autoComplete="new-password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar senha</Label>
          <AuthInput
            icon={Lock}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Repita a senha"
            autoComplete="new-password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            aria-invalid={passwordsMismatch}
            required
          />
        </div>
      </div>
      {passwordsMismatch ? (
        <p className="text-sm font-medium text-destructive">
          As senhas não coincidem.
        </p>
      ) : null}
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button
        type="submit"
        className="h-11 w-full rounded-lg"
        disabled={isPending || passwordsMismatch}
      >
        {isPending ? "Criando conta..." : "Criar conta"}
      </Button>
    </form>
  );
}
