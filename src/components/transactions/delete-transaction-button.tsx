"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteTransaction } from "@/lib/actions/transactions";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Excluir este lançamento?")) return;
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Lançamento excluído.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Excluir lançamento"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
