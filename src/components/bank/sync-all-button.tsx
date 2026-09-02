"use client";

import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { syncAllBankAccounts } from "@/lib/actions/bank-accounts";

export function SyncAllButton() {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await syncAllBankAccounts();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Contas sincronizadas.");
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={handleClick}>
      <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
      {isPending ? "Sincronizando..." : "Sincronizar tudo"}
    </Button>
  );
}
