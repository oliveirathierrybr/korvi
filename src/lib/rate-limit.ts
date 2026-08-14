import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Backed by the RateLimitHit table instead of an in-memory map — Vercel
 * serverless functions don't share memory across invocations/regions, so an
 * in-process counter would silently reset on every cold start.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: windowStart } },
  });

  if (count >= limit) {
    return false;
  }

  await prisma.rateLimitHit.create({ data: { key } });

  // Opportunistic cleanup so the table doesn't grow unbounded — no cron
  // needed, just occasionally sweep rows well outside any window we use.
  if (Math.random() < 0.01) {
    await prisma.rateLimitHit
      .deleteMany({
        where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      })
      .catch(() => {});
  }

  return true;
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
