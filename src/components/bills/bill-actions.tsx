"use client";

import { useTransition } from "react";
import { CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteBill, markBillPaid, reopenBill } from "@/lib/actions/bills";

export function MarkPaidButton({
  id,
  direction,
}: {
  id: string;
  direction: "PAGAR" | "RECEBER";
}) {
  const [isPending, startTransition] = useTransition();
  const label = direction === "PAGAR" ? "Marcar como pago" : "Marcar como recebido";

  function handleClick() {
    startTransition(async () => {
      const result = await markBillPaid(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(
        direction === "PAGAR"
          ? "Conta paga. Lançamento criado no caixa."
          : "Recebimento confirmado. Lançamento criado no caixa."
      );
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      title={label}
      disabled={isPending}
      onClick={handleClick}
    >
      <CheckCircle2 className="h-4 w-4 text-[#0ca30c]" />
    </Button>
  );
}

export function ReopenBillButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Reabrir esta conta? O lançamento no caixa será removido.")) return;
    startTransition(async () => {
      const result = await reopenBill(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta reaberta.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Reabrir conta"
      title="Reabrir conta"
      disabled={isPending}
      onClick={handleClick}
    >
      <RotateCcw className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}

export function DeleteBillButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Excluir esta conta?")) return;
    startTransition(async () => {
      const result = await deleteBill(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Conta excluída.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Excluir conta"
      disabled={isPending}
      onClick={handleClick}
    >
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
