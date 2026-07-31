"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, setSessionCookie } from "@/lib/session";
import { isValidCnpj, onlyDigits } from "@/lib/cnpj";
import { DEFAULT_CATEGORIES } from "@/lib/default-categories";
import { categoryColorLight } from "@/lib/colors";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginState = {
  error?: string;
};

const registerSchema = z
  .object({
    companyName: z.string().trim().min(1, "Informe o nome da empresa.").max(80),
    cnpj: z
      .string()
      .trim()
      .min(1, "Informe o CNPJ.")
      .refine((value) => isValidCnpj(value), "Informe um CNPJ válido."),
    name: z.string().trim().min(1, "Informe seu nome.").max(80),
    email: z.string().email("Informe um e-mail válido."),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string().min(1, "Confirme sua senha."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type RegisterState = {
  error?: string;
};

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    companyName: formData.get("companyName"),
    cnpj: formData.get("cnpj"),
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { companyName, name, email, password } = parsed.data;
  const cnpj = onlyDigits(parsed.data.cnpj);

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    return { error: "Já existe uma conta com este e-mail." };
  }

  const existingCnpj = await prisma.user.findFirst({ where: { cnpj } });
  if (existingCnpj) {
    return { error: "Já existe uma conta cadastrada com este CNPJ." };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { companyName, cnpj, name, email, passwordHash },
  });

  await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((c, i) => ({
      userId: user.id,
      name: c.name,
      type: c.type,
      color: categoryColorLight(i),
    })),
  });

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    companyName: user.companyName,
  });

  redirect("/dashboard");
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "E-mail ou senha inválidos." };
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return { error: "E-mail ou senha inválidos." };
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    name: user.name,
    companyName: user.companyName,
  });

  redirect("/dashboard");
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}
