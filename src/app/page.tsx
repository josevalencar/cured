"use client"

import { useEffect, useState } from "react"
import {
  fetchTodayReadings,
  computeMetrics,
} from "@/lib/microgrid-data"
import { getMockData, computeMetrics as computeMockMetrics } from "@/lib/mock-data"
import type { MicrogridReading, DerivedMetrics } from "@/lib/types"
import { PublicMetrics } from "@/components/dashboard/public-metrics"
import { SolarPowerChart } from "@/components/dashboard/solar-power-chart"
import { BatteryChart } from "@/components/dashboard/battery-chart"
import { WindTurbineChart } from "@/components/dashboard/wind-turbine-chart"
import { AcGridChart } from "@/components/dashboard/ac-grid-chart"
import { AnemometerChart } from "@/components/dashboard/anemometer-chart"

export default function Dashboard() {
  const [data, setData] = useState<MicrogridReading[]>([])
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const readings = await fetchTodayReadings()

        if (readings.length > 0) {
          setData(readings)
          setMetrics(computeMetrics(readings))
          setIsLive(true)
        } else {
          // No real data yet — fall back to mock
          const mock = getMockData()
          setData(mock)
          setMetrics(computeMockMetrics(mock))
          setIsLive(false)
        }
      } catch {
        // Supabase unreachable — fall back to mock
        const mock = getMockData()
        setData(mock)
        setMetrics(computeMockMetrics(mock))
        setIsLive(false)
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Refresh every 60 seconds to pick up new readings
    const interval = setInterval(loadData, 60_000)
    return () => clearInterval(interval)
  }, [])

  if (loading || !metrics) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Loading microgrid data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
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
        <h2 className="mb-1 text-xl font-semibold tracking-tight">
          Detailed Measurements
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Time-series data from the LabVIEW data acquisition system
          {isLive && (
            <span className="ml-1">
              — {data.length} readings today, refreshing every 60s
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SolarPowerChart data={data} />
          <BatteryChart data={data} />
          <WindTurbineChart data={data} />
          <AcGridChart data={data} />
          <AnemometerChart data={data} />
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
