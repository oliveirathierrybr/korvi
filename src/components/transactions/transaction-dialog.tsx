"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { toDateInputValue } from "@/lib/format";

type Category = { id: string; name: string; type: "ENTRADA" | "SAIDA" };

type TransactionForEdit = {
  id: string;
  type: "ENTRADA" | "SAIDA";
  amount: number;
  description: string;
  date: Date | string;
  categoryId: string;
};

export function TransactionDialog({
  categories,
  transaction,
}: {
  categories: Category[];
  transaction?: TransactionForEdit;
}) {
  const isEdit = Boolean(transaction);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"ENTRADA" | "SAIDA">(
    transaction?.type ?? "ENTRADA"
  );
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount) : ""
  );
  const [description, setDescription] = useState(
    transaction?.description ?? ""
  );
  const [date, setDate] = useState(
    transaction ? toDateInputValue(transaction.date) : toDateInputValue(new Date())
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ??
      categories.find((c) => c.type === "ENTRADA")?.id ??
      ""
  );
  const [isPending, startTransition] = useTransition();

  const filteredCategories = categories.filter((c) => c.type === type);

  function handleTypeChange(nextType: "ENTRADA" | "SAIDA") {
    setType(nextType);
    if (!categories.some((c) => c.id === categoryId && c.type === nextType)) {
      setCategoryId(categories.find((c) => c.type === nextType)?.id ?? "");
    }
  }

  function reset() {
    if (isEdit) return;
    setType("ENTRADA");
    setAmount("");
    setDescription("");
    setDate(toDateInputValue(new Date()));
    setCategoryId(categories.find((c) => c.type === "ENTRADA")?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    startTransition(async () => {
      const payload = {
        type,
        amount: parsedAmount,
        description,
        date,
        categoryId,
      };
      const result = isEdit
        ? await updateTransaction(transaction!.id, payload)
        : await createTransaction(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Lançamento atualizado." : "Lançamento criado.");
      reset();
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger
        render={
          isEdit ? (
            <Button variant="ghost" size="icon-sm" aria-label="Editar lançamento" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isEdit ? null : "Novo lançamento"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar lançamento" : "Novo lançamento"}
          </DialogTitle>
          <DialogDescription>
            Registre uma entrada ou saída do caixa.
          </DialogDescription>
        </DialogHeader>
        <form
          id={`transaction-form-${transaction?.id ?? "new"}`}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              items={{ ENTRADA: "Entrada", SAIDA: "Saída" }}
              value={type}
              onValueChange={(value) =>
                handleTypeChange((value as "ENTRADA" | "SAIDA") ?? "ENTRADA")
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">Entrada</SelectItem>
                <SelectItem value="SAIDA">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`amount-${transaction?.id ?? "new"}`}>
                Valor (R$)
              </Label>
              <Input
                id={`amount-${transaction?.id ?? "new"}`}
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`date-${transaction?.id ?? "new"}`}>Data</Label>
              <Input
                id={`date-${transaction?.id ?? "new"}`}
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`description-${transaction?.id ?? "new"}`}>
              Descrição
            </Label>
            <Input
              id={`description-${transaction?.id ?? "new"}`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Pagamento de fornecedor"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              items={Object.fromEntries(
                filteredCategories.map((c) => [c.id, c.name])
              )}
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form={`transaction-form-${transaction?.id ?? "new"}`}
            disabled={isPending || !categoryId || !description.trim() || !amount}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
