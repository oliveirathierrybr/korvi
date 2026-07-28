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
import { createBill, updateBill } from "@/lib/actions/bills";
import { toDateInputValue } from "@/lib/format";

type Category = { id: string; name: string };
type Direction = "PAGAR" | "RECEBER";

type BillForEdit = {
  id: string;
  description: string;
  amount: number;
  contactName: string;
  dueDate: Date | string;
  categoryId: string;
};

export function BillDialog({
  direction,
  categories,
  bill,
}: {
  direction: Direction;
  categories: Category[];
  bill?: BillForEdit;
}) {
  const isEdit = Boolean(bill);
  const contactLabel = direction === "PAGAR" ? "Fornecedor" : "Cliente";
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(bill?.description ?? "");
  const [amount, setAmount] = useState(bill ? String(bill.amount) : "");
  const [contactName, setContactName] = useState(bill?.contactName ?? "");
  const [dueDate, setDueDate] = useState(
    bill ? toDateInputValue(bill.dueDate) : toDateInputValue(new Date())
  );
  const [categoryId, setCategoryId] = useState(
    bill?.categoryId ?? categories[0]?.id ?? ""
  );
  const [isPending, startTransition] = useTransition();

  function reset() {
    if (isEdit) return;
    setDescription("");
    setAmount("");
    setContactName("");
    setDueDate(toDateInputValue(new Date()));
    setCategoryId(categories[0]?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    startTransition(async () => {
      const payload = {
        direction,
        description,
        amount: parsedAmount,
        contactName,
        dueDate,
        categoryId,
      };
      const result = isEdit
        ? await updateBill(bill!.id, payload)
        : await createBill(payload);

      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(isEdit ? "Conta atualizada." : "Conta criada.");
      reset();
      setOpen(false);
    });
  }

  const formId = `bill-form-${bill?.id ?? "new"}-${direction}`;

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
            <Button variant="ghost" size="icon-sm" aria-label="Editar conta" />
          ) : (
            <Button />
          )
        }
      >
        {isEdit ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
        {isEdit ? null : direction === "PAGAR" ? "Nova conta a pagar" : "Nova conta a receber"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar conta" : direction === "PAGAR" ? "Nova conta a pagar" : "Nova conta a receber"}
          </DialogTitle>
          <DialogDescription>
            {direction === "PAGAR"
              ? "Compromissos a pagar. Ao quitar, o valor entra automaticamente no caixa."
              : "Valores a receber. Ao confirmar o recebimento, o valor entra automaticamente no caixa."}
          </DialogDescription>
        </DialogHeader>
        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`${formId}-description`}>Descrição</Label>
            <Input
              id={`${formId}-description`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Aluguel de julho"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${formId}-amount`}>Valor (R$)</Label>
              <Input
                id={`${formId}-amount`}
                inputMode="decimal"
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${formId}-due`}>Vencimento</Label>
              <Input
                id={`${formId}-due`}
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${formId}-contact`}>{contactLabel}</Label>
            <Input
              id={`${formId}-contact`}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder={contactLabel}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
              value={categoryId}
              onValueChange={(value) => setCategoryId(value ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
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
            form={formId}
            disabled={
              isPending || !categoryId || !description.trim() || !amount || !contactName.trim()
            }
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
