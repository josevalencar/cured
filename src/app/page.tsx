"use client"

import { useEffect, useState, useCallback } from "react"
import {
  fetchReadings,
  computeMetrics,
} from "@/lib/microgrid-data"
import { getMockData, computeMetrics as computeMockMetrics } from "@/lib/mock-data"
import { downsample } from "@/lib/downsample"
import type { MicrogridReading, DerivedMetrics, DateRange } from "@/lib/types"
import { PublicMetrics } from "@/components/dashboard/public-metrics"
import { SolarPowerChart } from "@/components/dashboard/solar-power-chart"
import { BatteryChart } from "@/components/dashboard/battery-chart"
import { WindTurbineChart } from "@/components/dashboard/wind-turbine-chart"
import { AcGridChart } from "@/components/dashboard/ac-grid-chart"
import { AnemometerChart } from "@/components/dashboard/anemometer-chart"
import { DateRangeSelector } from "@/components/dashboard/date-range-selector"

const RANGE_LABELS: Record<DateRange, string> = {
  today: "today",
  week: "past 7 days",
  month: "past 30 days",
}

export default function Dashboard() {
  const [range, setRange] = useState<DateRange>("today")
  const [rawData, setRawData] = useState<MicrogridReading[]>([])
  const [chartData, setChartData] = useState<MicrogridReading[]>([])
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (selectedRange: DateRange) => {
    setLoading(true)
    try {
      const readings = await fetchReadings(selectedRange)

      if (readings.length > 0) {
        setRawData(readings)
        setChartData(downsample(readings))
        setMetrics(computeMetrics(readings))
        setIsLive(true)
      } else {
        const mock = getMockData()
        setRawData(mock)
        setChartData(mock)
        setMetrics(computeMockMetrics(mock))
        setIsLive(false)
      }
    } catch {
      const mock = getMockData()
      setRawData(mock)
      setChartData(mock)
      setMetrics(computeMockMetrics(mock))
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on mount and when range changes
  useEffect(() => {
    loadData(range)
  }, [range, loadData])

  // Auto-refresh every 60s (only for "today" to keep it live)
  useEffect(() => {
    if (range !== "today") return
    const interval = setInterval(() => loadData("today"), 60_000)
    return () => clearInterval(interval)
  }, [range, loadData])

  function handleRangeChange(newRange: DateRange) {
    setRange(newRange)
  }

  // First load: show a centered spinner
  if (!metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading microgrid data...</p>
      </div>
    )
  }

  // Subsequent loads (range switch): keep showing stale data with an opacity hint
  return (
    <div className={`space-y-8 transition-opacity ${loading ? "opacity-60" : ""}`}>
      <section>
        <h2 className="mb-1 text-2xl font-semibold tracking-tight">
          Microgrid Overview
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Clark University campus microgrid — solar, wind, battery, and grid
          monitoring
          {isLive ? (
            <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              Live
            </span>
          ) : (
            <span className="ml-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
              Mock data
            </span>
          )}
        </p>
        <PublicMetrics metrics={metrics} />
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Detailed Measurements
            </h2>
            <p className="text-sm text-muted-foreground">
              Time-series data from the LabVIEW data acquisition system
              {isLive && (
                <span className="ml-1">
                  — {rawData.length.toLocaleString()} readings ({RANGE_LABELS[range]})
                  {chartData.length < rawData.length && (
                    <span>
                      , averaged to {chartData.length} points
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
          {isLive && (
            <DateRangeSelector
              value={range}
              onChange={handleRangeChange}
              disabled={loading}
            />
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SolarPowerChart data={chartData} />
          <BatteryChart data={chartData} />
          <WindTurbineChart data={chartData} />
          <AcGridChart data={chartData} />
          <AnemometerChart data={chartData} />
        </div>
      </section>

      <section className="rounded-lg border bg-muted/50 p-4 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Data notes</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          {!isLive && (
            <li>
              Charts show <strong>mock data</strong> based on representative
              microgrid patterns. Live data will appear when available.
            </li>
          )}
          <li>
            Solar energy and CO₂ metrics are <strong>derived values</strong>,
            not directly measured. CO₂ uses the EPA eGRID average US emissions
            factor of 0.386 kg/kWh.
          </li>
          <li>
            Sign conventions for AC grid power and battery current have{" "}
            <strong>not been confirmed</strong> with Professor Agosta.
          </li>
          <li>
            Anemometer data is unavailable — the Raspberry Pi is on a different
            Wi-Fi network than the iMac.
          </li>
        </ul>
      </section>
    </div>
  )
}
