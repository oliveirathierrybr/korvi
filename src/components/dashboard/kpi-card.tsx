import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: "good" | "bad" | "neutral";
  hint?: string;
}) {
  const color =
    tone === "good" ? "#0ca30c" : tone === "bad" ? "#d03b3b" : undefined;

  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-2 pt-6">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p
            className="mt-1 truncate text-lg font-semibold tabular-nums xl:text-2xl"
            style={color ? { color } : undefined}
          >
            {formatCurrency(value)}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      </CardContent>
    </Card>
  );
}
