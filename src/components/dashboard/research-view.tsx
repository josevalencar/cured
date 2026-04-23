"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  DateRange,
  DerivedMetrics,
  MicrogridReading,
} from "@/lib/types"
import { NowStrip } from "./now-strip"
import { SubsystemTab } from "./subsystem-tab"
import { SolarPowerChart } from "./solar-power-chart"
import { BatteryChart } from "./battery-chart"
import { WindTurbineChart } from "./wind-turbine-chart"
import { AcGridChart } from "./ac-grid-chart"

const RANGE_LABELS: Record<DateRange, string> = {
  today: "today",
  week: "the past 7 days",
  month: "the past 30 days",
}

interface LearnSectionProps {
  chartData: MicrogridReading[]
  rawData: MicrogridReading[]
  metrics: DerivedMetrics
  range: DateRange
  onRangeChange: (range: DateRange) => void
  isLive: boolean
  loading: boolean
}

function computeSolarStats(data: MicrogridReading[]) {
  if (!data.length) return { peak: "—", peakTime: "—", total: "—" }
  let peakVal = 0
  let peakLabel = "—"
  let totalWh = 0
  for (const r of data) {
    if (r.PVpow > peakVal) {
      peakVal = r.PVpow
      peakLabel = r.label
    }
    if (r.PVpow > 5) totalWh += r.PVpow * (1 / 60)
  }
  return {
    peak:
      peakVal >= 1000
        ? `${(peakVal / 1000).toFixed(2)} kW`
        : `${peakVal.toFixed(0)} W`,
    peakTime: peakLabel,
    total: `${(totalWh / 1000).toFixed(2)}`,
  }
}

function computeBatteryStats(data: MicrogridReading[]) {
  if (!data.length) return { charge: "—", discharge: "—", voltage: "—" }
  let maxCharge = 0
  let maxDischarge = 0
  for (const r of data) {
    if (r.BattPow > maxCharge) maxCharge = r.BattPow
    if (r.BattPow < maxDischarge) maxDischarge = r.BattPow
  }
  const latest = data[data.length - 1]
  return {
    charge: `${maxCharge.toFixed(0)}`,
    discharge: `${Math.abs(maxDischarge).toFixed(0)}`,
    voltage: `${latest.BattV.toFixed(1)}`,
  }
}

function computeWindStats(data: MicrogridReading[]) {
  if (!data.length) return { hawt: "—", vawt: "—", winner: "—" }
  let maxH = 0
  let maxV = 0
  for (const r of data) {
    if (r.HAWTrms > maxH) maxH = r.HAWTrms
    if (r.VAWTrms > maxV) maxV = r.VAWTrms
  }
  return {
    hawt: maxH.toFixed(1),
    vawt: maxV.toFixed(1),
    winner: maxH >= maxV ? "HAWT" : "VAWT",
  }
}

function computeGridStats(data: MicrogridReading[]) {
  if (!data.length) return { voltage: "—", peak: "—", latest: "—" }
  let peakAbs = 0
  let vSum = 0
  let vCount = 0
  for (const r of data) {
    if (Math.abs(r.acPower) > peakAbs) peakAbs = Math.abs(r.acPower)
    if (r.ACVolts > 0) {
      vSum += r.ACVolts
      vCount++
    }
  }
  const latest = data[data.length - 1]
  return {
    voltage: vCount ? (vSum / vCount).toFixed(0) : "—",
    peak: peakAbs.toFixed(0),
    latest: latest.acPower.toFixed(0),
  }
}

export function LearnSection({
  chartData,
  rawData,
  metrics,
  range,
  onRangeChange,
  isLive,
  loading,
}: LearnSectionProps) {
  const solarStats = computeSolarStats(chartData)
  const batteryStats = computeBatteryStats(chartData)
  const windStats = computeWindStats(chartData)
  const gridStats = computeGridStats(chartData)

  return (
    <section
      id="learn"
      className={`min-h-screen bg-background transition-opacity ${
        loading ? "opacity-80" : ""
      }`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="pt-16 pb-6 sm:pt-24 sm:pb-10">
          <p className="small-caps text-[11px] text-muted-foreground sm:text-xs">
            What you&rsquo;re looking at
          </p>
          <h2 className="font-serif-display mt-3 text-[clamp(2.5rem,8vw,5.5rem)]">
            The sun, the wind,
            <br />
            and a battery.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Four subsystems make up Clark&rsquo;s campus microgrid. This
            section walks through each one and explains what the data means.
            Keep scrolling to see them one at a time.
          </p>
        </div>

        <div className="hairline" />

        <NowStrip metrics={metrics} />

        <div className="hairline" />

        <section className="py-10 sm:py-14">
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="small-caps text-[11px] text-muted-foreground">
                the details
              </p>
              <h2 className="font-serif-display mt-1 text-3xl sm:text-4xl">
                Four systems, one grid.
              </h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                Pick a subsystem below. You&rsquo;re looking at{" "}
                {RANGE_LABELS[range]}
                {isLive && rawData.length > 0 && (
                  <>
                    {" "}&middot;{" "}
                    <span className="font-mono text-[11px]">
                      {rawData.length.toLocaleString()} readings
                    </span>
                  </>
                )}
                .
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <span className="small-caps text-[10px] text-muted-foreground">
                time range
              </span>
              <div className="inline-flex border border-rule/30 bg-card p-0.5">
                {(["today", "week", "month"] as DateRange[]).map((r) => {
                  const label =
                    r === "today"
                      ? "Today"
                      : r === "week"
                        ? "7 days"
                        : "30 days"
                  const active = r === range
                  return (
                    <button
                      key={r}
                      type="button"
                      disabled={loading}
                      onClick={() => onRangeChange(r)}
                      className={`small-caps px-4 py-1.5 text-[11px] transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <Tabs defaultValue="solar" className="gap-6">
            <TabsList
              variant="line"
              className="flex w-full flex-wrap justify-start gap-0 border-b border-rule/20 pb-0"
            >
              <TabsTrigger
                value="solar"
                className="small-caps !h-auto !flex-none !rounded-none !px-4 !py-3 !text-xs"
              >
                Solar
              </TabsTrigger>
              <TabsTrigger
                value="wind"
                className="small-caps !h-auto !flex-none !rounded-none !px-4 !py-3 !text-xs"
              >
                Wind
              </TabsTrigger>
              <TabsTrigger
                value="battery"
                className="small-caps !h-auto !flex-none !rounded-none !px-4 !py-3 !text-xs"
              >
                Battery
              </TabsTrigger>
              <TabsTrigger
                value="grid"
                className="small-caps !h-auto !flex-none !rounded-none !px-4 !py-3 !text-xs"
              >
                AC Grid
              </TabsTrigger>
            </TabsList>

            <TabsContent value="solar">
              <SubsystemTab
                eyebrow="photovoltaic array"
                title="The solar bell curve."
                intro="Output from the rooftop PV array tracks the sun across the sky. A clear day draws a smooth dome; clouds punch holes in it."
                accent="var(--solar)"
                stats={[
                  { label: "peak power", value: solarStats.peak },
                  { label: "at", value: solarStats.peakTime },
                  { label: "energy", value: solarStats.total, unit: "kWh" },
                ]}
                note="Readings below 5 W are treated as zero (sensor noise at night). Total energy sums PVpow × 1/60 over the range."
                chart={<SolarPowerChart data={chartData} />}
              />
            </TabsContent>

            <TabsContent value="wind">
              <SubsystemTab
                eyebrow="wind turbines"
                title="Horizontal vs. vertical."
                intro="Clark runs two turbine designs side by side. HAWT spins like a pinwheel; VAWT spins like a carousel. The chart shows each one's RMS voltage as wind passes through."
                accent="var(--wind)"
                stats={[
                  { label: "peak HAWT", value: windStats.hawt, unit: "V" },
                  { label: "peak VAWT", value: windStats.vawt, unit: "V" },
                  { label: "leader", value: windStats.winner },
                ]}
                chart={<WindTurbineChart data={chartData} />}
              />
            </TabsContent>

            <TabsContent value="battery">
              <SubsystemTab
                eyebrow="battery bank"
                title="Charge, discharge, repeat."
                intro="The battery stores surplus solar and wind energy, then releases it when the sun goes down. Positive values mean power into the battery; negative means power out."
                accent="var(--battery)"
                stats={[
                  { label: "max charge", value: batteryStats.charge, unit: "W" },
                  {
                    label: "max discharge",
                    value: batteryStats.discharge,
                    unit: "W",
                  },
                  { label: "now at", value: batteryStats.voltage, unit: "V" },
                ]}
                note="Sign convention for BattCurr has not been confirmed with Professor Agosta — values are shown as recorded."
                chart={<BatteryChart data={chartData} />}
              />
            </TabsContent>

            <TabsContent value="grid">
              <SubsystemTab
                eyebrow="ac utility connection"
                title="Into the grid, or out?"
                intro="When the microgrid produces more than the lab needs, the excess flows into the campus grid. When it needs more, it borrows back. This is the exchange."
                accent="var(--grid)"
                stats={[
                  { label: "ac voltage", value: gridStats.voltage, unit: "V" },
                  { label: "peak |flow|", value: gridStats.peak, unit: "W" },
                  { label: "right now", value: gridStats.latest, unit: "W" },
                ]}
                note="Sign convention (import vs. export) is not yet confirmed. Treat ± as a measurement, not a claim."
                chart={<AcGridChart data={chartData} />}
              />
            </TabsContent>
          </Tabs>
        </section>

        <div className="double-rule" />

        <footer className="py-10 sm:py-14">
          <div className="grid gap-8 sm:grid-cols-[2fr_1fr]">
            <div>
              <p className="small-caps text-[11px] text-muted-foreground">
                colophon
              </p>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                CURED reads data from a LabVIEW application running on an iMac
                in the renewable-energy lab. The dashboard
                is built by the PHYS 243/343 class under Professor Agosta.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:items-end">
              <a
                href="/research"
                className="small-caps inline-flex items-center gap-2 border border-rule/40 px-4 py-2 text-[11px] text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Open research view →
              </a>
              <p className="font-mono text-[10px] text-muted-foreground/70">
                Clark University · Worcester, MA
              </p>
            </div>
          </div>
        </footer>
      </div>
    </section>
  )
}
