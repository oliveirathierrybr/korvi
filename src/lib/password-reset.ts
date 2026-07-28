import { randomBytes, createHash } from "crypto";

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hora

export function generateResetToken() {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  return { token, tokenHash };
}

export function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
