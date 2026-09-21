import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  companyName: string;
  sessionVersion: number;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Além de validar assinatura/expiração do JWT, confere o `sessionVersion`
 * contra o valor atual no banco — proxy.ts (edge) só faz a checagem de
 * assinatura por não ter acesso a Prisma ali, então esta é a barreira real
 * que faz um reset de senha invalidar tokens antigos antes dos 30 dias.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { sessionVersion: true },
  });
  if (!user || user.sessionVersion !== payload.sessionVersion) {
    return null;
  }

  return payload;
}

/**
 * Use in Server Actions and data-loading functions that must never run
 * without an authenticated user — proxy.ts already gates page navigation,
 * but Server Actions are invoked directly and must verify on their own.
 */
export async function requireUserId(): Promise<string> {
  const session = await getSession();
  if (!session) {
    throw new Error("Não autenticado.");
  }
  return session.userId;
}
