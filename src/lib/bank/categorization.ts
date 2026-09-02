import { prisma } from "@/lib/prisma";

// Tabela estática de palavras-chave conhecidas → nome de categoria sugerido.
// É só uma sugestão inicial; o usuário sempre pode corrigir, e ao corrigir
// (ver applyCategorizationCorrection) o Korvi aprende uma regra específica
// para aquele usuário via BankCategoryRule, que tem prioridade sobre esta
// tabela nas próximas sincronizações.
const STATIC_KEYWORD_RULES: Array<{ pattern: string; categoryName: string }> = [
  { pattern: "UBER", categoryName: "Transporte" },
  { pattern: "99APP", categoryName: "Transporte" },
  { pattern: "IFOOD", categoryName: "Alimentação" },
  { pattern: "RAPPI", categoryName: "Alimentação" },
  { pattern: "AMAZON", categoryName: "Compras" },
  { pattern: "MERCADO LIVRE", categoryName: "Compras" },
  { pattern: "POSTO", categoryName: "Combustível" },
  { pattern: "SHELL", categoryName: "Combustível" },
  { pattern: "IPIRANGA", categoryName: "Combustível" },
  { pattern: "TARIFA BANCARIA", categoryName: "Tarifas bancárias" },
];

// Faixa Unicode das marcas de acento combinantes (U+0300–U+036F), geradas
// pela forma decomposta NFD (ex.: "ã" vira "a" + combining tilde).
const DIACRITICS_REGEX = /[̀-ͯ]/g;

export function normalize(description: string) {
  return description
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "") // remove acentos (forma decomposta)
    .toUpperCase();
}

// Palavras que aparecem em descrições de tipos de movimentação bem
// diferentes (um PIX recebido de um cliente e um PIX pago a um fornecedor
// têm "PIX" em comum, mas nada a ver categoricamente) — nunca viram o
// padrão aprendido, senão a regra passaria a capturar transações não
// relacionadas só porque compartilham esse termo genérico.
const GENERIC_TOKENS = new Set([
  "PAGAMENTO",
  "PAGAMENTOS",
  "RECEBIDO",
  "RECEBIDA",
  "RECEBIMENTO",
  "TRANSFERENCIA",
  "TRANSFERIDO",
  "TRANSFERIDA",
  "DEPOSITO",
  "SAQUE",
  "COMPRA",
  "DEBITO",
  "CREDITO",
  "BANCARIA",
  "BANCARIO",
  "CARTAO",
  "PARCELA",
  "TARIFA",
  "ENVIADA",
  "ENVIADO",
  "LANCAMENTO",
  "MOVIMENTACAO",
  // Sufixos societários — presentes no nome de quase toda empresa brasileira,
  // então nunca identificam um fornecedor/cliente específico.
  "LTDA",
  "EIRELI",
]);

/**
 * Escolhe a "palavra relevante" de uma descrição já normalizada para virar o
 * padrão de uma BankCategoryRule aprendida — a primeira com pelo menos 4
 * letras que não seja um termo genérico demais (ver GENERIC_TOKENS).
 * Retorna null quando nenhuma palavra da descrição é específica o
 * suficiente, em vez de cair para uma palavra curta ou genérica que
 * aprenderia uma regra ruim.
 */
export function pickPatternToken(normalizedDescription: string): string | null {
  const words = normalizedDescription.split(/\s+/).filter(Boolean);
  return words.find((word) => word.length >= 4 && !GENERIC_TOKENS.has(word)) ?? null;
}

/**
 * Sugere um categoryId para uma descrição de movimentação bancária, sem
 * nunca aplicar a categoria sozinho — só sugere. Prioridade: regra
 * aprendida do próprio usuário (BankCategoryRule) primeiro, tabela estática
 * de palavras-chave depois.
 */
export async function suggestCategoryId(
  userId: string,
  description: string
): Promise<string | null> {
  const normalized = normalize(description);

  const userRules = await prisma.bankCategoryRule.findMany({
    where: { userId },
  });
  const learnedMatch = userRules.find((rule) => normalized.includes(rule.pattern));
  if (learnedMatch) {
    return learnedMatch.categoryId;
  }

  const staticMatch = STATIC_KEYWORD_RULES.find((rule) =>
    normalized.includes(rule.pattern)
  );
  if (!staticMatch) {
    return null;
  }

  const category = await prisma.category.findFirst({
    where: { userId, name: staticMatch.categoryName, type: "SAIDA" },
  });
  if (category) {
    return category.id;
  }

  // O nome sugerido (ex.: "Transporte") pode não existir nas categorias do
  // usuário — as categorias padrão do Korvi (src/lib/default-categories.ts)
  // são voltadas a despesas de empresa, não a gastos do dia a dia como
  // Uber/iFood. Em vez de não sugerir nada, cai para uma categoria
  // genérica de despesas, se existir, para a sugestão continuar útil.
  const fallback = await prisma.category.findFirst({
    where: { userId, type: "SAIDA", name: { in: ["Despesas Operacionais", "Outras Despesas"] } },
    orderBy: { name: "asc" },
  });
  return fallback?.id ?? null;
}

/**
 * Chamado quando o usuário corrige/define manualmente a categoria de uma
 * movimentação bancária — grava uma regra para que descrições semelhantes
 * já venham sugeridas nas próximas sincronizações.
 */
export async function learnCategoryRule(
  userId: string,
  description: string,
  categoryId: string
) {
  const normalized = normalize(description);
  const token = pickPatternToken(normalized);
  if (!token) return;

  await prisma.bankCategoryRule.upsert({
    where: { userId_pattern: { userId, pattern: token } },
    update: { categoryId },
    create: { userId, pattern: token, categoryId },
  });
}
