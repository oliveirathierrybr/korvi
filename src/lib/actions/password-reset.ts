"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";
import {
  generateResetToken,
  hashResetToken,
  RESET_TOKEN_TTL_MS,
} from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/email";

async function getOrigin() {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

const forgotPasswordSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
});

export type ForgotPasswordState = {
  error?: string;
  success?: boolean;
};

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  // Sempre retorna a mesma mensagem, exista ou não a conta, para não revelar
  // quais e-mails estão cadastrados.
  if (!user) {
    return { success: true };
  }

  const { token, tokenHash } = generateResetToken();

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const origin = await getOrigin();
  const resetUrl = `${origin}/redefinir-senha?token=${token}`;

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });
  } catch (error) {
    console.error("Falha ao enviar e-mail de redefinição de senha:", error);
    return {
      error:
        "Não foi possível enviar o e-mail agora. Tente novamente em instantes.",
    };
  }

  return { success: true };
}

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type ResetPasswordState = {
  error?: string;
};

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const tokenHash = hashResetToken(parsed.data.token);
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return {
      error:
        "Este link de redefinição é inválido ou expirou. Solicite um novo.",
    };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });
    return updated;
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    companyName: user.companyName,
  });

  redirect("/dashboard");
}
