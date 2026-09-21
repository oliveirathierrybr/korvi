"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppSectionError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <h2 className="text-lg font-semibold">Não foi possível carregar esta tela</h2>
      <p className="max-w-sm text-sm text-muted-foreground">
        Ocorreu um erro inesperado. Tente novamente em instantes.
      </p>
      <Button onClick={() => unstable_retry()}>Tentar novamente</Button>
    </div>
  );
}
