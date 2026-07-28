"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function ReportFilters({
  defaultFrom,
  defaultTo,
}: {
  defaultFrom: string;
  defaultTo: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? defaultFrom;
  const to = searchParams.get("to") ?? defaultTo;

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  const exportParams = new URLSearchParams(searchParams.toString());
  if (!exportParams.get("from")) exportParams.set("from", from);
  if (!exportParams.get("to")) exportParams.set("to", to);

  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">De</label>
          <Input
            type="date"
            className="w-40"
            value={from}
            onChange={(e) => updateParam("from", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Até</label>
          <Input
            type="date"
            className="w-40"
            value={to}
            onChange={(e) => updateParam("to", e.target.value)}
          />
        </div>
      </div>
      <Button
        variant="outline"
        nativeButton={false}
        render={<a href={`/relatorios/export?${exportParams.toString()}`} />}
      >
        <Download className="h-4 w-4" />
        Exportar CSV
      </Button>
    </div>
  );
}
