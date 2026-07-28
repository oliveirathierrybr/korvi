import { Wallet } from "lucide-react";

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
          "linear-gradient(155deg, #1e1245 0%, #3f1d8c 48%, #6d28d9 100%)",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 15%, white 0, transparent 40%), radial-gradient(circle at 85% 65%, white 0, transparent 35%)",
        }}
      />
      <div className="relative flex items-center gap-2 text-lg font-semibold">
        <Wallet className="h-6 w-6" />
        Fluxo
      </div>
      <div className="relative space-y-4">
        <p className="text-3xl font-semibold leading-tight text-balance">
          {title}
        </p>
        <p className="max-w-md text-sm text-white/80">{description}</p>
      </div>
      <p className="relative text-xs text-white/60">
        © {new Date().getFullYear()} Fluxo. Gestão financeira simples para
        pequenas empresas.
      </p>
    </div>
  );
}
