// Utilitário compartilhado de exportação CSV. Extraído de
// src/app/(app)/relatorios/export/route.ts para poder ser testado sem subir
// um Route Handler completo.

const FORMULA_TRIGGER_CHARS = new Set(["=", "+", "-", "@", "\t", "\r"]);

/**
 * Neutraliza "CSV formula injection": se o campo começa com um caractere que
 * o Excel/Google Sheets interpretaria como início de fórmula (=, +, -, @, ou
 * tab/CR), prefixa com um apóstrofo. Isso força o programa de planilha a
 * tratar o valor como texto literal em vez de avaliá-lo — sem essa proteção,
 * uma descrição de lançamento como `=cmd|'/c calc'!A1` (campo livre, digitado
 * pelo próprio usuário) executaria ao abrir o CSV exportado.
 */
function neutralizeFormula(value: string): string {
  if (value.length > 0 && FORMULA_TRIGGER_CHARS.has(value[0])) {
    return `'${value}`;
  }
  return value;
}

/**
 * Escapa um campo para uma linha CSV delimitada por `;` (convenção do Excel
 * em locale pt-BR, onde `,` é separador decimal). Envolve em aspas quando o
 * campo contém aspas, o delimitador, `;` ou quebra de linha.
 */
export function csvField(value: string, delimiter = ";"): string {
  const safe = neutralizeFormula(value);
  if (/["\n,;]/.test(safe) || safe.includes(delimiter)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function toCsvRow(fields: string[], delimiter = ";"): string {
  return fields.map((f) => csvField(f, delimiter)).join(delimiter);
}
