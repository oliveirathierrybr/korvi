"use client";

import { useActionState, useState } from "react";
import { Lock } from "lucide-react";
import {
  resetPasswordAction,
  type ResetPasswordState,
} from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AuthInput } from "@/components/auth-input";

const initialState: ResetPasswordState = {};

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, isPending] = useActionState(
    resetPasswordAction,
    initialState
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      <div className="space-y-2">
        <Label htmlFor="password">Nova senha</Label>
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
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
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
        {isPending ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}
