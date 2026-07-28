import Image from "next/image";

export function AuthHero({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="relative hidden flex-col justify-between overflow-hidden p-10 text-white lg:flex"
      style={{
        backgroundImage:
          "linear-gradient(155deg, #051c37 0%, #0d2b4e 45%, #01ad8c 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 15%, white 0, transparent 40%), radial-gradient(circle at 85% 65%, white 0, transparent 35%)",
        }}
      />
      <div className="relative flex items-center gap-2 text-lg font-semibold">
        <Image src="/brand/icon-mark.png" alt="" width={28} height={28} priority />
        Korvi
      </div>
      <div className="relative space-y-4">
        <p className="text-3xl font-semibold leading-tight text-balance">
          {title}
        </p>
        <p className="max-w-md text-sm text-white/80">{description}</p>
      </div>
      <p className="relative text-xs text-white/60">
        © {new Date().getFullYear()} Korvi. Gestão financeira inteligente
        para pequenas empresas.
      </p>
    </div>
  );
}
