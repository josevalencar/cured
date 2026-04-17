"use client"

import type { MicrogridReading } from "@/lib/types"

interface LiveTickerProps {
  latest: MicrogridReading | null
}

function formatSigned(n: number, unit: string, digits = 0) {
  const sign = n >= 0 ? "+" : "−"
  return `${sign}${Math.abs(n).toFixed(digits)} ${unit}`
}

export function LiveTicker({ latest }: LiveTickerProps) {
  const items: { label: string; value: string; accent: string }[] = latest
    ? [
        {
          label: "PV",
          value: `${latest.PVpow.toFixed(0)} W`,
          accent: "var(--solar)",
        },
        {
          label: "BATT",
          value: `${latest.BattV.toFixed(1)} V`,
          accent: "var(--battery)",
        },
        {
          label: "BATT FLOW",
          value: formatSigned(latest.BattPow, "W"),
          accent: "var(--battery)",
        },
        {
          label: "HAWT",
          value: `${latest.HAWTrms.toFixed(1)} V`,
          accent: "var(--wind)",
        },
        {
          label: "VAWT",
          value: `${latest.VAWTrms.toFixed(1)} V`,
          accent: "var(--wind)",
        },
        {
          label: "WIND",
          value: `${latest.anemometer.toFixed(1)} MPH`,
          accent: "var(--wind)",
        },
        {
          label: "AC GRID",
          value: formatSigned(latest.acPower, "W"),
          accent: "var(--grid)",
        },
        {
          label: "AC VOLTS",
          value: `${latest.ACVolts.toFixed(0)} V`,
          accent: "var(--grid)",
        },
      ]
    : [
        { label: "status", value: "awaiting readings…", accent: "var(--muted-foreground)" },
      ]

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden bg-ink py-3">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-ink to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-ink to-transparent"
      />
      <div className="ticker-track flex w-max whitespace-nowrap">
        {doubled.map((it, i) => (
          <div
            key={i}
            className="flex items-baseline gap-2 px-6 font-mono text-[clamp(0.75rem,1.5vw,1rem)] text-white/80"
          >
            <span
              className="small-caps text-[0.7em]"
              style={{ color: it.accent }}
            >
              {it.label}
            </span>
            <span>{it.value}</span>
            <span className="text-white/20">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
