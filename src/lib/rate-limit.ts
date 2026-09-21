import "server-only";
import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Backed by the RateLimitHit table instead of an in-memory map — Vercel
 * serverless functions don't share memory across invocations/regions, so an
 * in-process counter would silently reset on every cold start.
 *
 * Count-then-insert as two separate queries would let a truly parallel burst
 * slip a few requests past the limit (both read the count before either
 * writes). A single INSERT ... WHERE (SELECT count...) < limit is one
 * statement, so Postgres evaluates and writes atomically — no race window.
 * Still fully parametrized, no string interpolation into SQL.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);
  const id = randomUUID();

  const inserted = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "RateLimitHit" ("id", "key", "createdAt")
    SELECT ${id}, ${key}, now()
    WHERE (
      SELECT count(*)::int FROM "RateLimitHit"
      WHERE "key" = ${key} AND "createdAt" >= ${windowStart}
    ) < ${limit}
    RETURNING "id"
  `;

  const allowed = inserted.length > 0;

  // Opportunistic cleanup so the table doesn't grow unbounded — no cron
  // needed, just occasionally sweep rows well outside any window we use.
  if (Math.random() < 0.01) {
    await prisma.rateLimitHit
      .deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      })
      .catch(() => {});
  }

  return allowed;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  return h.get("x-real-ip") ?? "unknown";
}

export const RATE_LIMIT_MESSAGE =
  "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
