"use client";

import { useTheme } from "next-themes";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { categoryColorForTheme } from "@/lib/colors";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/hooks/use-mounted";

type Slice = { name: string; color: string; total: number };

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-1.5 font-medium">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: entry.payload.color }}
        />
        {entry.name}
      </p>
      <p className="tabular-nums text-muted-foreground">
        {formatCurrency(entry.value)}
      </p>
    </div>
  );
}

export function CategoryPieChart({
  data,
  emptyMessage = "Sem lançamentos neste período.",
}: {
  data: Slice[];
  emptyMessage?: string;
}) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";

  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const top = data.slice(0, 8);

  return (
    <div className="space-y-3">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={top}
              dataKey="total"
              nameKey="name"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="var(--card)"
              strokeWidth={2}
            >
              {top.map((slice) => (
                <Cell
                  key={slice.name}
                  fill={categoryColorForTheme(slice.color, isDark)}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="grid grid-cols-1 gap-x-4 gap-y-1.5">
        {top.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: categoryColorForTheme(slice.color, isDark) }}
              />
              <span className="truncate">{slice.name}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatCurrency(slice.total)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
