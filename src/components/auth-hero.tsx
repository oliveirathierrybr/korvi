import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

const bars = [38, 62, 45, 78, 55, 90];

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
      {/* mesh de cor para dar profundidade */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 15%, rgba(1,173,140,0.45) 0%, transparent 42%), radial-gradient(circle at 85% 5%, rgba(13,43,78,0.7) 0%, transparent 50%), radial-gradient(circle at 60% 95%, rgba(1,173,140,0.3) 0%, transparent 45%)",
        }}
      />
      {/* grade sutil para textura */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative flex items-center gap-2 text-lg font-semibold">
        <Image src="/brand/icon-mark.png" alt="" width={28} height={28} priority />
        Korvi
      </div>

      <div className="relative space-y-6">
        <div className="space-y-4">
          <p className="text-3xl font-semibold leading-tight text-balance">
            {title}
          </p>
          <p className="max-w-md text-sm text-white/75">{description}</p>
        </div>

        {/* card flutuante com prévia do produto */}
        <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs text-white/70">Saldo atual</p>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[#01ad8c]/25 px-1.5 py-0.5 text-[10px] font-medium text-[#5eead4]">
              <ArrowUpRight className="h-3 w-3" />
              12%
            </span>
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight">
            R$ 24.850,00
          </p>
          <div className="mt-4 flex h-12 items-end gap-1.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm bg-gradient-to-t from-[#01ad8c] to-[#5eead4]"
                style={{ height: `${h}%`, opacity: 0.5 + i * 0.08 }}
              />
            ))}
          </div>
        </div>
      </div>

      <p className="relative text-xs text-white/60">
        © {new Date().getFullYear()} Korvi. Gestão financeira inteligente
        para pequenas empresas.
      </p>
    </div>
  );
}
