"use client"

import Image from "next/image"
import Link from "next/link"
import { useResearchData } from "@/lib/use-research-data"
import { PublicMetrics } from "@/components/dashboard/public-metrics"
import { SolarPowerChart } from "@/components/dashboard/solar-power-chart"
import { BatteryChart } from "@/components/dashboard/battery-chart"
import { WindTurbineChart } from "@/components/dashboard/wind-turbine-chart"
import { AcGridChart } from "@/components/dashboard/ac-grid-chart"
import { AnemometerChart } from "@/components/dashboard/anemometer-chart"
import { WindCorrelationChart } from "@/components/dashboard/wind-correlation-chart"
import { WeatherSummary } from "@/components/dashboard/weather-summary"
import { DatePicker } from "@/components/dashboard/date-range-selector"
import { format } from "date-fns"

export default function ResearchPage() {
  const {
    selection,
    setSelection,
    rawData,
    chartData,
    metrics,
    latestWeather,
    isLive,
    loading,
  } = useResearchData({ range: "today" })

  // The selected date as a JS Date object (for the picker UI)
  const selectedDate = selection.date ? new Date(selection.date + "T12:00:00") : new Date()

  function handleDateChange(date: Date | undefined) {
    if (!date) return
    setSelection({ range: "today", date: format(date, "yyyy-MM-dd") })
  }

  if (!metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading microgrid data...</p>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen font-sans text-foreground"
      style={{ backgroundColor: "#FAFBFC" }}
    >
      <header className="sticky top-0 z-50 border-b border-white/10 bg-clark-red text-white shadow-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Image
              src="/clark.png"
              alt="Clark University seal"
              width={36}
              height={36}
              className="rounded-full"
            />
            <div>
              <h1 className="text-lg font-semibold leading-tight tracking-tight">
                CURED
              </h1>
              <p className="text-xs leading-tight text-white/75">
                Clark University Renewable Energy Dashboard
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-white/80">
            <span className="hidden items-center gap-2 sm:inline-flex">
              <span className="inline-block h-2 w-2 rounded-full bg-green-400" />
              PHYS 243/343
            </span>
            <Link
              href="/"
              className="border border-white/30 px-2 py-1 transition-colors hover:bg-white hover:text-clark-red"
            >
              ← Public view
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div
          className={`space-y-8 transition-opacity ${
            loading ? "opacity-60" : ""
          }`}
        >
          <section>
            <h2 className="mb-1 text-2xl font-semibold tracking-tight">
              Microgrid Overview
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Clark University campus microgrid — solar, wind, battery, and
              grid monitoring
              {isLive && (
                <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                  Live
                </span>
              )}
            </p>
            <PublicMetrics metrics={metrics} />
          </section>

          <section>
            <h2 className="mb-1 text-2xl font-semibold tracking-tight">
              Weather Station
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Live atmospheric conditions from the Tempest sensor on the
              Biophysics roof
            </p>
            <WeatherSummary latest={latestWeather} />
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Detailed Measurements
                </h2>
                <p className="text-sm text-muted-foreground">
                  Time-series data from the LabVIEW data acquisition system
                  {isLive && rawData.length > 0 && (
                    <span className="ml-1">
                      — {rawData.length.toLocaleString()} readings
                      {chartData.length < rawData.length && (
                        <span>, averaged to {chartData.length} points</span>
                      )}
                    </span>
                  )}
                </p>
              </div>
              <DatePicker
                value={selectedDate}
                onChange={handleDateChange}
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SolarPowerChart data={chartData} />
              <BatteryChart data={chartData} />
              <WindTurbineChart data={chartData} />
              <AcGridChart data={chartData} />
              <AnemometerChart data={chartData} />
              <WindCorrelationChart data={chartData} />
            </div>
          </section>

          <section className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">Data notes</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                Solar energy and CO₂ metrics are{" "}
                <strong>derived values</strong>, not directly measured. CO₂
                uses the EPA eGRID average US emissions factor of 0.386 kg/kWh.
              </li>
              <li>
                Sign conventions for AC grid power and battery current have{" "}
                <strong>not been confirmed</strong> with Professor Agosta.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <footer className="border-t bg-white py-6 text-center text-xs text-muted-foreground">
        <p>
          Clark University · Department of Physics · Professor Agosta
        </p>
        <p className="mt-1">PHYS 243/343 - Technology of Renewable Energy</p>
      </footer>
    </div>
  )
}
