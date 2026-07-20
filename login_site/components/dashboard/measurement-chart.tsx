"use client"

import { MEASUREMENTS } from "@/lib/data"

const SERIES = [
  { key: "cintura", label: "Cintura", color: "oklch(0.46 0.055 158)" },
  { key: "abdomen", label: "Abdômen", color: "oklch(0.66 0.1 46)" },
  { key: "quadril", label: "Quadril", color: "oklch(0.62 0.045 158)" },
] as const

export function MeasurementChart() {
  const width = 520
  const height = 220
  const pad = { top: 16, right: 16, bottom: 28, left: 32 }

  const all = MEASUREMENTS.flatMap((m) => [m.cintura, m.abdomen, m.quadril])
  const min = Math.min(...all) - 4
  const max = Math.max(...all) + 4

  const x = (i: number) =>
    pad.left + (i / (MEASUREMENTS.length - 1)) * (width - pad.left - pad.right)
  const y = (v: number) =>
    pad.top + (1 - (v - min) / (max - min)) * (height - pad.top - pad.bottom)

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-4 pb-4">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-xs text-ink-soft">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Gráfico de evolução de medidas corporais por sessão"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const gy = pad.top + t * (height - pad.top - pad.bottom)
          return (
            <line
              key={t}
              x1={pad.left}
              x2={width - pad.right}
              y1={gy}
              y2={gy}
              stroke="oklch(0.88 0.012 120)"
              strokeWidth={1}
            />
          )
        })}
        {/* X labels */}
        {MEASUREMENTS.map((m, i) => (
          <text
            key={m.session}
            x={x(i)}
            y={height - 8}
            textAnchor="middle"
            className="fill-[oklch(0.5_0.02_155)] text-[10px]"
          >
            {m.session}
          </text>
        ))}
        {/* Lines */}
        {SERIES.map((s) => {
          const d = MEASUREMENTS.map(
            (m, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(m[s.key])}`,
          ).join(" ")
          return (
            <g key={s.key}>
              <path d={d} fill="none" stroke={s.color} strokeWidth={2.5} strokeLinecap="round" />
              {MEASUREMENTS.map((m, i) => (
                <circle key={i} cx={x(i)} cy={y(m[s.key])} r={3.5} fill={s.color} />
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
