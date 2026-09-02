"use client";

import { useState, useTransition } from "react";
import { Check, Link2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  categorizeBankTransaction,
  createTransactionFromBankTransaction,
  ignoreBankTransaction,
  linkBankTransactionToBill,
} from "@/lib/actions/bank-accounts";
import { formatCurrency, formatDate } from "@/lib/format";

type Category = { id: string; name: string; type: "ENTRADA" | "SAIDA" };
type Bill = {
  id: string;
  description: string;
  amount: number;
  contactName: string;
  direction: "PAGAR" | "RECEBER";
};
type PendingTx = {
  id: string;
  description: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  transactionDate: Date | string;
  categoryId: string | null;
  bankAccount: { institutionName: string };
};

export function ReconciliationQueue({
  transactions,
  categories,
  openBills,
}: {
  transactions: PendingTx[];
  categories: Category[];
  openBills: Bill[];
}) {
  if (transactions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        Nenhuma movimentação pendente de conciliação.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {transactions.map((tx) => (
        <ReconciliationRow
          key={tx.id}
          tx={tx}
          categories={categories.filter((c) => c.type === (tx.type === "CREDIT" ? "ENTRADA" : "SAIDA"))}
          openBills={openBills.filter((b) => b.direction === (tx.type === "DEBIT" ? "PAGAR" : "RECEBER"))}
        />
      ))}
    </div>
  );
}

function ReconciliationRow({
  tx,
  categories,
  openBills,
}: {
  tx: PendingTx;
  categories: Category[];
  openBills: Bill[];
}) {
  // Igual ao padrão de bill-dialog.tsx: o Select do Base UI mostra o
  // rótulo do primeiro item quando `value` não corresponde a nenhum item
  // (em vez do placeholder) — por isso nunca deixamos o valor inicial como
  // "" quando há categorias disponíveis, para o que aparece na tela sempre
  // bater com o que de fato seria salvo.
  const [categoryId, setCategoryId] = useState(tx.categoryId ?? categories[0]?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [billDialogOpen, setBillDialogOpen] = useState(false);

  function handleCategorize() {
    if (!categoryId) {
      toast.error("Selecione uma categoria.");
      return;
    }
    startTransition(async () => {
      const result = await categorizeBankTransaction({ bankTransactionId: tx.id, categoryId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria salva.");
    });
  }

  function handleCreateTransaction() {
    if (!categoryId) {
      toast.error("Selecione uma categoria antes de criar o lançamento.");
      return;
    }
    startTransition(async () => {
      const result = await createTransactionFromBankTransaction({
        bankTransactionId: tx.id,
        categoryId,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Lançamento criado no caixa.");
    });
  }

  function handleIgnore() {
    if (!confirm("Ignorar esta movimentação? Ela não afetará seu caixa.")) return;
    startTransition(async () => {
      const result = await ignoreBankTransaction(tx.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Movimentação ignorada.");
    });
  }

  function handleLinkBill(billId: string) {
    startTransition(async () => {
      const result = await linkBankTransactionToBill({ bankTransactionId: tx.id, billId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Vinculado. Lançamento criado no caixa.");
      setBillDialogOpen(false);
    });
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{tx.description}</p>
          <Badge variant="outline" className="shrink-0 border-transparent bg-[#fab219]/15 text-[#a15c00] dark:text-[#fab219]">
            Nova movimentação bancária
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {tx.bankAccount.institutionName} · {formatDate(tx.transactionDate)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <p
          className={`tabular-nums font-semibold ${
            tx.type === "CREDIT" ? "text-[#0ca30c]" : "text-[#d03b3b]"
          }`}
        >
          {tx.type === "CREDIT" ? "+" : "-"} {formatCurrency(tx.amount)}
        </p>

        <Select
          items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          value={categoryId}
          onValueChange={(value) => setCategoryId(value ?? "")}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" disabled={isPending} onClick={handleCategorize}>
          Categorizar
        </Button>

        <Dialog open={billDialogOpen} onOpenChange={setBillDialogOpen}>
          <DialogTrigger render={<Button variant="outline" size="sm" disabled={openBills.length === 0} />}>
            <Link2 className="h-4 w-4" />
            Vincular a conta
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Vincular a uma conta</DialogTitle>
              <DialogDescription>
                Escolha a conta a {tx.type === "DEBIT" ? "pagar" : "receber"} correspondente a
                esta movimentação.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-72 space-y-2 overflow-y-auto">
              {openBills.map((bill) => (
                <button
                  key={bill.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleLinkBill(bill.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-border p-2.5 text-left text-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                >
                  <span>
                    {bill.description}
                    <span className="block text-xs text-muted-foreground">{bill.contactName}</span>
                  </span>
                  <span className="font-medium tabular-nums">{formatCurrency(bill.amount)}</span>
                </button>
              ))}
              {openBills.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma conta em aberto compatível.</p>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="default" size="sm" disabled={isPending} onClick={handleCreateTransaction}>
          <Check className="h-4 w-4" />
          Criar lançamento
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Ignorar"
          title="Ignorar"
          disabled={isPending}
          onClick={handleIgnore}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  );
}
