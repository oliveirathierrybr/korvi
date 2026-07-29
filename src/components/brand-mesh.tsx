// Fundo de marca reutilizável: gradiente navy -> verde-água, mesh de cor e
// textura de grade sutil. Use dentro de um container "relative overflow-hidden".
export function BrandMesh() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(160deg, #051c37 0%, #0d2b4e 42%, #01ad8c 100%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 10%, rgba(1,173,140,0.4) 0%, transparent 40%), radial-gradient(circle at 90% 0%, rgba(13,43,78,0.75) 0%, transparent 45%), radial-gradient(circle at 50% 100%, rgba(1,173,140,0.3) 0%, transparent 45%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />
    </>
  );
}
