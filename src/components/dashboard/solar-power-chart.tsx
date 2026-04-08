"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
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
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { MicrogridReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  PVpow: {
    label: "Power (W)",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

interface SolarPowerChartProps {
  data: MicrogridReading[]
}

export function SolarPowerChart({ data }: SolarPowerChartProps) {
  const xProps = xAxisProps(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Solar Power Curve</CardTitle>
        <CardDescription>
          PV power output over 24 hours - characteristic bell-shaped irradiance
          profile
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="solarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              {...xProps}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v: number) => `${v}W`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="linear"
              dataKey="PVpow"
              stroke="var(--color-PVpow)"
              fill="url(#solarGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
