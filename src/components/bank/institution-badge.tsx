// Não usamos logo real de nenhum banco (risco de marca registrada sem
// licença) — um badge gerado com iniciais + cor da própria instituição
// (ver src/lib/bank/providers/mock-bank-provider.ts) resolve visualmente
// sem depender de um asset de terceiro. Uma integração real usaria a URL de
// logo devolvida pelo provedor no lugar deste componente.
export function InstitutionBadge({
  initials,
  colorHex,
  size = "default",
}: {
  initials: string;
  colorHex: string;
  size?: "default" | "sm";
}) {
  return (
    <div
      className={
        size === "sm"
          ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white"
          : "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
      }
      style={{ backgroundColor: colorHex }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
