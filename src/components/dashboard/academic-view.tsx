"use client"

import Image from "next/image"
import Link from "next/link"
import type { DerivedMetrics, MicrogridReading } from "@/lib/types"
import type { MicrogridSelection } from "@/lib/use-microgrid-data"
import { SolarPowerChart } from "./solar-power-chart"
import { BatteryChart } from "./battery-chart"
import { WindTurbineChart } from "./wind-turbine-chart"
import { AcGridChart } from "./ac-grid-chart"
import { DatePicker } from "./date-range-selector"

interface AcademicViewProps {
  chartData: MicrogridReading[]
  rawData: MicrogridReading[]
  metrics: DerivedMetrics
  selection: MicrogridSelection
  onSelectionChange: (sel: MicrogridSelection) => void
  isLive: boolean
  loading: boolean
}

function computeRangeStats(data: MicrogridReading[]) {
  if (!data.length) {
    return {
      solarEnergy: "—",
      peakSolar: "—",
      battMin: "—",
      battMax: "—",
      gridPeak: "—",
      windPeakH: "—",
      windPeakV: "—",
    }
  }
  let peakSolar = 0
  let totalWh = 0
  let battMin = Infinity
  let battMax = -Infinity
  let gridPeakAbs = 0
  let maxH = 0
  let maxV = 0
  for (const r of data) {
    if (r.PVpow > peakSolar) peakSolar = r.PVpow
    if (r.PVpow > 5) totalWh += r.PVpow * (1 / 60)
    if (r.BattV < battMin && r.BattV > 0) battMin = r.BattV
    if (r.BattV > battMax) battMax = r.BattV
    if (Math.abs(r.acPower) > gridPeakAbs) gridPeakAbs = Math.abs(r.acPower)
    if (r.HAWTrms > maxH) maxH = r.HAWTrms
    if (r.VAWTrms > maxV) maxV = r.VAWTrms
  }
  return {
    solarEnergy: (totalWh / 1000).toFixed(3),
    peakSolar: peakSolar.toFixed(0),
    battMin: battMin === Infinity ? "—" : battMin.toFixed(2),
    battMax: battMax === -Infinity ? "—" : battMax.toFixed(2),
    gridPeak: gridPeakAbs.toFixed(0),
    windPeakH: maxH.toFixed(2),
    windPeakV: maxV.toFixed(2),
  }
}

export function AcademicView({
  chartData,
  rawData,
  metrics,
  selection,
  onSelectionChange,
  isLive,
  loading,
}: AcademicViewProps) {
  const stats = computeRangeStats(chartData)

  const activeRange = selection.date ? null : selection.range

  function selectRange(r: "today" | "week" | "month") {
    onSelectionChange({ range: r, date: null })
  }

  function selectDate(dateISO: string) {
    onSelectionChange({ range: "today", date: dateISO })
  }

  const rangeLabel = selection.date
    ? selection.date
    : selection.range === "today"
      ? "today"
      : selection.range === "week"
        ? "past 7 days"
        : "past 30 days"

  return (
    <div
      className={`min-h-screen bg-background font-sans text-foreground transition-opacity ${
        loading ? "opacity-80" : ""
      }`}
    >
      {/* Clark-red masthead */}
      <header className="border-b-4 border-foreground bg-clark-red text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <Image
              src="/clark.png"
              alt="Clark University"
              width={40}
              height={40}
              className="rounded-full ring-1 ring-white/30"
            />
            <div className="leading-tight">
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/70 uppercase sm:text-[10px]">
                Clark University · Dept. of Physics
              </p>
              <h1 className="mt-0.5 text-base font-semibold tracking-tight text-white sm:text-lg">
                CURED — Research View
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-white/80 sm:gap-5 sm:text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isLive ? "bg-emerald-300 live-dot" : "bg-amber-300"
                }`}
              />
              <span className="tracking-[0.1em] uppercase">
                {isLive ? "live" : "mock"}
              </span>
            </span>
            <span className="hidden tabular-nums sm:inline">
              n = {rawData.length.toLocaleString()}
            </span>
            <Link
              href="/"
              className="border border-white/30 px-2 py-1 text-white transition-colors hover:bg-white hover:text-clark-red"
            >
              ← Public view
            </Link>
          </div>
        </div>
        <div className="border-t border-white/15 bg-black/10">
          <div className="mx-auto max-w-7xl px-4 py-1.5 font-mono text-[9px] tracking-[0.2em] text-white/65 uppercase sm:px-6 sm:text-[10px] lg:px-8">
            PHYS 243 / 343 · Technology of Renewable Energy · Prof. Agosta
          </div>
        </div>
      </header>

      {/* Control strip */}
      <div className="border-b border-rule/30 bg-card/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              range
            </span>
            {(["today", "week", "month"] as const).map((r) => {
              const label =
                r === "today" ? "Today" : r === "week" ? "7d" : "30d"
              const active = activeRange === r
              return (
                <button
                  key={r}
                  type="button"
                  disabled={loading}
                  onClick={() => selectRange(r)}
                  className={`border px-3 py-1 font-mono text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    active
                      ? "border-clark-red bg-clark-red text-white"
                      : "border-rule/40 bg-card text-foreground hover:border-clark-red/60 hover:bg-muted"
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
              or date
            </span>
            <DatePicker
              value={
                selection.date
                  ? (() => {
                      const [y, m, d] = selection.date.split("-").map(Number)
                      return new Date(y, m - 1, d)
                    })()
                  : undefined
              }
              onChange={(d) => {
                if (!d) {
                  selectRange("today")
                  return
                }
                const y = d.getFullYear()
                const m = String(d.getMonth() + 1).padStart(2, "0")
                const day = String(d.getDate()).padStart(2, "0")
                selectDate(`${y}-${m}-${day}`)
              }}
              disabled={loading}
            />
            {selection.date && (
              <button
                type="button"
                onClick={() => selectRange("today")}
                className="font-mono text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                clear
              </button>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {/* Summary numerics row — academic table-style */}
        <section aria-label="Summary" className="mb-6">
          <h2 className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            <span aria-hidden className="h-[2px] w-5 bg-clark-red" />
            Summary
          </h2>
          <div className="grid grid-cols-2 divide-y divide-rule/20 border border-rule/30 border-l-4 border-l-clark-red bg-card font-mono text-[12px] sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            <div className="px-4 py-3">
              <div className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Solar energy
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {stats.solarEnergy}{" "}
                <span className="text-[10px] text-muted-foreground">kWh</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Peak PV
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {stats.peakSolar}{" "}
                <span className="text-[10px] text-muted-foreground">W</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Batt range
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {stats.battMin}–{stats.battMax}{" "}
                <span className="text-[10px] text-muted-foreground">V</span>
              </div>
            </div>
            <div className="px-4 py-3">
              <div className="text-[10px] tracking-[0.15em] text-muted-foreground uppercase">
                Peak |AC|
              </div>
              <div className="mt-1 text-lg font-semibold tabular-nums">
                {stats.gridPeak}{" "}
                <span className="text-[10px] text-muted-foreground">W</span>
              </div>
            </div>
          </div>
          <p className="mt-2 font-mono text-[10px] text-muted-foreground">
            scope: {rangeLabel} · sample interval: ~60 s ·{" "}
            {chartData.length.toLocaleString()} plotted points
          </p>
        </section>

        {/* Dense chart grid */}
        <h2 className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
          <span aria-hidden className="h-[2px] w-5 bg-clark-red" />
          Time series
        </h2>
        <section aria-label="Time series" className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard
            title="PV Power"
            subtitle="PVpow (W) — rooftop photovoltaic array output"
          >
            <SolarPowerChart data={chartData} />
          </ChartCard>

          <ChartCard
            title="Battery Power"
            subtitle="BattPow (W) — positive = charge, negative = discharge"
          >
            <BatteryChart data={chartData} />
          </ChartCard>

          <ChartCard
            title="Wind Turbine RMS Voltage"
            subtitle="HAWTrms vs. VAWTrms (V)"
          >
            <WindTurbineChart data={chartData} />
          </ChartCard>

          <ChartCard
            title="AC Grid Power"
            subtitle="acPower (W) — positive = export, negative = import"
          >
            <AcGridChart data={chartData} />
          </ChartCard>
        </section>

        {/* Current readings strip */}
        <section aria-label="Latest sample" className="mt-6">
          <h2 className="mb-2 flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
            <span aria-hidden className="h-[2px] w-5 bg-clark-red" />
            Latest reading
          </h2>
          <LatestRow reading={rawData[rawData.length - 1]} metrics={metrics} />
        </section>

        {/* Methodology */}
        <section className="mt-8 border-t-2 border-clark-red/70 pt-5 font-mono text-[11px] leading-relaxed text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Methodology.</span> Readings are
            sampled by a LabVIEW acquisition program at one-minute intervals.
            Solar energy is computed as Σ PVpow × (1/60) / 1000 for PVpow &gt; 5
            W. CO₂ avoided uses the EPA eGRID US-average emissions factor of
            0.386 kg/kWh. Positive acPower = exporting to the utility;
            negative = importing. Battery current sign convention is still
            unconfirmed and is shown as recorded.
          </p>
        </section>
      </main>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <figure className="border border-rule/30 bg-card">
      <figcaption className="flex items-baseline gap-3 border-b border-rule/20 px-4 py-3">
        <span
          aria-hidden
          className="h-3 w-[3px] shrink-0 bg-clark-red"
        />
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {title}
          </h3>
          <p className="font-mono text-[10px] text-muted-foreground">
            {subtitle}
          </p>
        </div>
      </figcaption>
      <div className="px-2 pt-2 pb-3 sm:px-4">{children}</div>
    </figure>
  )
}

function LatestRow({
  reading,
  metrics,
}: {
  reading: MicrogridReading | undefined
  metrics: DerivedMetrics
}) {
  if (!reading) {
    return (
      <p className="font-mono text-[11px] text-muted-foreground">
        no sample available
      </p>
    )
  }
  const cells: { k: string; v: string }[] = [
    { k: "t", v: reading.time },
    { k: "PVvolts", v: `${reading.PVvolts.toFixed(2)} V` },
    { k: "PVcur", v: `${reading.PVcur.toFixed(2)} A` },
    { k: "PVpow", v: `${reading.PVpow.toFixed(1)} W` },
    { k: "BattV", v: `${reading.BattV.toFixed(2)} V` },
    { k: "BattCurr", v: `${reading.BattCurr.toFixed(2)} A` },
    { k: "BattPow", v: `${reading.BattPow.toFixed(1)} W` },
    { k: "HAWTrms", v: `${reading.HAWTrms.toFixed(2)} V` },
    { k: "VAWTrms", v: `${reading.VAWTrms.toFixed(2)} V` },
    { k: "acPower", v: `${reading.acPower.toFixed(1)} W` },
    { k: "ACVolts", v: `${reading.ACVolts.toFixed(1)} V` },
    { k: "anemometer", v: `${reading.anemometer.toFixed(1)} MPH` },
    { k: "batt status", v: metrics.batteryStatus },
  ]
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-1 border border-rule/20 bg-card p-3 font-mono text-[11px] sm:grid-cols-4 lg:grid-cols-6">
      {cells.map((c) => (
        <div key={c.k} className="flex items-baseline justify-between gap-2">
          <span className="text-[9px] tracking-[0.1em] text-muted-foreground uppercase">
            {c.k}
          </span>
          <span className="tabular-nums text-foreground">{c.v}</span>
        </div>
      ))}
    </div>
  )
}
