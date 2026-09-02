// Lógica pura de escolha de candidata para conciliação automática — extraída
// de BankSyncService.tryAutoReconcile (src/lib/bank/bank-sync-service.ts) para
// poder ser testada sem precisar de um banco de dados. Não faz nenhuma
// chamada a Prisma; só recebe as candidatas já filtradas (mesmo userId, tipo
// compatível, valor igual, dentro da janela de dias) e decide qual (se
// alguma) deve ser conciliada.
export type ReconciliationCandidate = { id: string; date: Date };

/**
 * Critério: menor diferença absoluta de data em relação a `targetDate`. Se
 * houver mais de uma candidata empatada na menor diferença, não escolhe
 * nenhuma — errar um casamento automático é pior do que deixar pendente para
 * revisão manual.
 */
export function pickReconciliationMatch<T extends ReconciliationCandidate>(
  candidates: T[],
  targetDate: Date
): T | null {
  if (candidates.length === 0) return null;

  const sorted = [...candidates].sort(
    (a, b) =>
      Math.abs(a.date.getTime() - targetDate.getTime()) -
      Math.abs(b.date.getTime() - targetDate.getTime())
  );

  const closest = Math.abs(sorted[0].date.getTime() - targetDate.getTime());
  const secondClosest =
    sorted[1] && Math.abs(sorted[1].date.getTime() - targetDate.getTime());

  if (secondClosest !== undefined && secondClosest === closest) {
    return null;
  }

  return sorted[0];
}
