import "server-only";
import { headers } from "next/headers";

export { isAllowedRedirectUri } from "@/lib/bank/redirect-validation";

/**
 * URL para onde o provedor Open Finance (real ou o MockBankProvider) deve
 * devolver o navegador do usuário após o consentimento. Resolvida uma única
 * vez no servidor a partir de env var ou do próprio host da requisição —
 * nunca deve ser aceita de volta como valor de query string sem validação
 * (ver isAllowedRedirectUri em redirect-validation.ts), ou vira um open
 * redirect.
 */
export async function resolveRedirectUri(): Promise<string> {
  if (process.env.OPEN_FINANCE_REDIRECT_URI) {
    return process.env.OPEN_FINANCE_REDIRECT_URI;
  }
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  return `${proto}://${host}/api/open-finance/callback`;
}
