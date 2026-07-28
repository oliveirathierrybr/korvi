"use client";

import { useActionState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  forgotPasswordAction,
  type ForgotPasswordState,
} from "@/lib/actions/password-reset";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: ForgotPasswordState = {};

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex items-start gap-3 rounded-lg border bg-muted/30 p-4 text-sm">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p>
          Se esse e-mail estiver cadastrado, enviamos um link de redefinição
          de senha. Confira também a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="voce@empresa.com"
          autoComplete="email"
          required
        />
      </div>
      {state.error ? (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Enviando..." : "Enviar link de redefinição"}
      </Button>
    </form>
  );
}
