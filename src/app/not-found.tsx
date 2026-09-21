import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">Página não encontrada</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        O endereço acessado não existe ou foi movido.
      </p>
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Voltar ao painel
      </Button>
    </div>
  );
}
