"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PontoTendencia } from "@/modules/agenda/tendencia";

const formatadorDiaCurto = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

function formatarRotulo(data: string) {
  return formatadorDiaCurto.format(new Date(`${data}T00:00:00.000Z`));
}

export function GraficoAtendimentos({ pontos }: { pontos: PontoTendencia[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={pontos} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="corAtendimentos" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--color-border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="data"
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            tickFormatter={formatarRotulo}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-muted)" }}
            tickLine={false}
            width={28}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid var(--color-border)",
              fontSize: 12,
            }}
            formatter={(valor) => {
              const numero = Number(Array.isArray(valor) ? valor[0] : valor);

              return [`${numero} atendimento${numero === 1 ? "" : "s"}`, ""];
            }}
            labelFormatter={(valor) => formatarRotulo(String(valor))}
          />
          <Area
            dataKey="total"
            fill="url(#corAtendimentos)"
            stroke="var(--color-brand)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
