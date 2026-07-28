"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteCategory } from "@/lib/actions/categories";

export function DeleteCategoryButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("Excluir esta categoria?")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoria excluída.");
    });
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label="Excluir categoria"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="h-4 w-4 text-muted-foreground" />
    </Button>
  );
}
