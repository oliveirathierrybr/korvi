// Função pura, sem `server-only`/`next/headers`, para poder ser importada em
// testes (vitest) sem disparar o guard de "server-only" — ver
// src/lib/bank/callback-url.ts, que reexporta isto junto com
// resolveRedirectUri (essa sim precisa rodar só no servidor).

/**
 * Confere que um redirectUri recebido de volta de um redirecionamento (ex.:
 * da tela simulada de autorização, ver /api/open-finance/mock-decide) é
 * exatamente o que este servidor gerou para aquele consentimento — nunca uma
 * URL arbitrária controlada por quem monta a query string.
 */
export function isAllowedRedirectUri(candidate: string, expected: string): boolean {
  return candidate === expected;
}
