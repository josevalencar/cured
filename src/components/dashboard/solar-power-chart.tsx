"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MicrogridReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  PVpow: {
    label: "Power",
    color: "var(--solar)",
  },
  energyKwh: {
    label: "Cumulative energy",
    color: "var(--clark-red)",
  },
} satisfies ChartConfig

interface SolarPowerChartProps {
  data: MicrogridReading[]
}

function withCumulativeEnergy(data: MicrogridReading[]) {
  let runningWh = 0
  return data.map((r) => {
    if (r.PVpow > 5) runningWh += r.PVpow * (1 / 60)
    return {
      ...r,
      energyKwh: Number((runningWh / 1000).toFixed(3)),
    }
  })
}

export function SolarPowerChart({ data }: SolarPowerChartProps) {
  const xProps = xAxisProps(data)
  const enriched = useMemo(() => withCumulativeEnergy(data), [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solar Power</CardTitle>
        <CardDescription>
          PV array output (W) and cumulative energy (kWh)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <ComposedChart
            data={enriched}
            margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="1 4"
              vertical={false}
              stroke="var(--rule)"
              strokeOpacity={0.15}
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              fontSize={10}
              stroke="var(--muted-foreground)"
              {...xProps}
            />
            <YAxis
              yAxisId="power"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="var(--solar)"
              tickFormatter={(v: number) => `${v} W`}
            />
            <YAxis
              yAxisId="energy"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="var(--clark-red)"
              tickFormatter={(v: number) => `${v} kWh`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    const n = Number(value)
                    if (name === "PVpow") return [`${n.toFixed(0)} W`, "Power"]
                    if (name === "energyKwh")
                      return [`${n.toFixed(2)} kWh`, "Energy so far"]
                    return [String(value), String(name)]
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              yAxisId="power"
              type="monotone"
              dataKey="PVpow"
              stroke="var(--solar)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="energy"
              type="monotone"
              dataKey="energyKwh"
              stroke="var(--clark-red)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
