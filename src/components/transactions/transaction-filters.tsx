"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Category = { id: string; name: string; type: "ENTRADA" | "SAIDA" };

export function TransactionFilters({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const type = searchParams.get("type") ?? "TODOS";
  const categoryId = searchParams.get("categoryId") ?? "TODAS";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "TODOS" || value === "TODAS") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const hasFilters = type !== "TODOS" || categoryId !== "TODAS" || from || to;

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tipo
        </label>
        <Select
          items={{ TODOS: "Todos", ENTRADA: "Entrada", SAIDA: "Saída" }}
          value={type}
          onValueChange={(v) => updateParam("type", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ENTRADA">Entrada</SelectItem>
            <SelectItem value="SAIDA">Saída</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Categoria
        </label>
        <Select
          items={{
            TODAS: "Todas",
            ...Object.fromEntries(categories.map((c) => [c.id, c.name])),
          }}
          value={categoryId}
          onValueChange={(v) => updateParam("categoryId", v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODAS">Todas</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          De
        </label>
        <Input
          type="date"
          className="w-40"
          value={from}
          onChange={(e) => updateParam("from", e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Até
        </label>
        <Input
          type="date"
          className="w-40"
          value={to}
          onChange={(e) => updateParam("to", e.target.value)}
        />
      </div>
      {hasFilters ? (
        <Button variant="ghost" onClick={() => router.push(pathname)}>
          Limpar filtros
        </Button>
      ) : null}
    </div>
  );
}
