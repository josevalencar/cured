"use client"

import type { DerivedMetrics } from "@/lib/types"

interface NowStripProps {
  metrics: DerivedMetrics
}

export function NowStrip({ metrics }: NowStripProps) {
  const figures = [
    {
      label: "solar today",
      value: metrics.solarEnergyKwh.toFixed(1),
      unit: "kWh",
      note: "Σ PVpow × 1/60 ÷ 1000",
    },
    {
      label: "co₂ avoided",
      value: metrics.co2AvoidedKg.toFixed(1),
      unit: "kg",
      note: "EPA eGRID factor 0.386",
    },
    {
      label: "battery",
      value: metrics.batteryStatus.toLowerCase(),
      unit: `${metrics.currentBatteryVoltage.toFixed(1)} V`,
      note: "threshold ±0.5 A",
      isText: true,
    },
    {
      label: "system",
      value: metrics.systemOnline ? "online" : "offline",
      unit: metrics.systemOnline ? "running" : "down",
      note: "any PV > 5 W or |acPower| > 10 W",
      isText: true,
    },
  ]

  return (
    <section
      aria-label="Current microgrid state"
      className="grid grid-cols-2 gap-x-4 gap-y-10 py-8 sm:gap-x-8 lg:grid-cols-4 lg:gap-x-10"
    >
      {figures.map((f, i) => (
        <figure
          key={f.label}
          className="rise-in flex flex-col border-l border-rule/30 pl-3 sm:pl-4"
          style={{ animationDelay: `${150 + i * 120}ms` }}
        >
          <figcaption className="small-caps mb-2 text-[10px] text-muted-foreground sm:text-xs">
            {f.label}
          </figcaption>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif-display text-foreground ${
                f.isText
                  ? "text-[clamp(2.5rem,8vw,5rem)]"
                  : "text-[clamp(3.5rem,11vw,7rem)]"
              }`}
            >
              {f.value}
            </span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-muted-foreground sm:text-xs">
            {f.unit}
          </div>
          <div className="mt-3 hidden font-mono text-[10px] text-muted-foreground/70 sm:block">
            {f.note}
          </div>
        </figure>
      ))}
    </section>
  )
}
