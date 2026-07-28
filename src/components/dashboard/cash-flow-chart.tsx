"use client";

import { useTheme } from "next-themes";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { chartChrome, entradaColor, saidaColor } from "@/lib/colors";
import { formatCurrency } from "@/lib/format";
import { useMounted } from "@/hooks/use-mounted";

type Point = { month: string; entrada: number; saida: number };

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; dataKey: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="mb-1 font-medium">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground">
            {entry.dataKey === "entrada" ? "Entradas" : "Saídas"}
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrency(entry.value)}
          </span>
        </p>
      ))}
    </div>
  );
}

export function CashFlowChart({ data }: { data: Point[] }) {
  const { resolvedTheme } = useTheme();
  const mounted = useMounted();
  const isDark = mounted && resolvedTheme === "dark";
  const chrome = isDark ? chartChrome.dark : chartChrome.light;

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ left: -16, right: 8, top: 8 }}>
          <CartesianGrid vertical={false} stroke={chrome.grid} />
          <XAxis
            dataKey="month"
            tick={{ fill: chrome.muted, fontSize: 12 }}
            axisLine={{ stroke: chrome.axis }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: chrome.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={64}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
            }
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: isDark ? "#ffffff0d" : "#0000000d" }}
          />
          <Bar
            dataKey="entrada"
            fill={isDark ? entradaColor.dark : entradaColor.light}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            dataKey="saida"
            fill={isDark ? saidaColor.dark : saidaColor.light}
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
