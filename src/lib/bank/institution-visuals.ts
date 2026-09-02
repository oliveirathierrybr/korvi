import { categoricalPalette } from "@/lib/colors";

// Deriva iniciais e cor de forma determinística a partir do id/nome da
// instituição — usado tanto pelo MockBankProvider (que só tem o id/nome
// disponíveis) quanto pelos cards já salvos no banco (que não guardam um
// campo de cor à parte). Mantém o badge gerado consistente em toda a UI
// sem depender de logo real de banco (ver institution-badge.tsx).

export function institutionInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function institutionColor(institutionId: string) {
  let hash = 0;
  for (let i = 0; i < institutionId.length; i++) {
    hash = (hash * 31 + institutionId.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % categoricalPalette.length;
  return categoricalPalette[index].light;
}
