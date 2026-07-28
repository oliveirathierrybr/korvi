"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { categoricalPalette } from "@/lib/colors";
import { createCategory } from "@/lib/actions/categories";

export function CategoryDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"ENTRADA" | "SAIDA">("ENTRADA");
  const [color, setColor] = useState<string>(categoricalPalette[0].light);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setType("ENTRADA");
    setColor(categoricalPalette[0].light);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createCategory({ name, type, color });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria criada com sucesso.");
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
      <DialogTrigger render={<Button />}>
        <Plus className="h-4 w-4" />
        Nova categoria
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova categoria</DialogTitle>
          <DialogDescription>
            Categorias organizam suas entradas e saídas no caixa e nos
            relatórios.
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fornecedores"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Tipo</Label>
            <Select
              items={{ ENTRADA: "Entrada", SAIDA: "Saída" }}
              value={type}
              onValueChange={(value) => setType(value as "ENTRADA" | "SAIDA")}
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
          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap gap-2">
              {categoricalPalette.map((c) => (
                <button
                  key={c.slot}
                  type="button"
                  aria-label={c.name}
                  onClick={() => setColor(c.light)}
                  className={cn(
                    "h-7 w-7 rounded-full ring-offset-2 ring-offset-background transition-shadow",
                    color === c.light && "ring-2 ring-foreground"
                  )}
                  style={{ backgroundColor: c.light }}
                />
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="category-form"
            disabled={isPending || !name.trim()}
          >
            {isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
