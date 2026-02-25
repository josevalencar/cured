"use client"

import { getMockData, computeMetrics } from "@/lib/mock-data"
import { PublicMetrics } from "@/components/dashboard/public-metrics"
import { SolarPowerChart } from "@/components/dashboard/solar-power-chart"
import { BatteryChart } from "@/components/dashboard/battery-chart"
import { WindTurbineChart } from "@/components/dashboard/wind-turbine-chart"
import { AcGridChart } from "@/components/dashboard/ac-grid-chart"
import { AnemometerChart } from "@/components/dashboard/anemometer-chart"

export default function Dashboard() {
  const data = getMockData()
  const metrics = computeMetrics(data)

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-2xl font-semibold tracking-tight">
          Microgrid Overview
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Clark University campus microgrid - solar, wind, battery, and grid
          monitoring
        </p>
        <PublicMetrics metrics={metrics} />
      </section>

      <section>
        <h2 className="mb-1 text-xl font-semibold tracking-tight">
          Detailed Measurements
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Time-series data from the LabVIEW data acquisition system (mock data
          shown - real integration pending)
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
          <li>
            All charts show <strong>mock data</strong> based on representative
            microgrid patterns. Real data integration is planned.
          </li>
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
