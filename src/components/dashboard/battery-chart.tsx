"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ReferenceLine,
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { MicrogridReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  BattPow: {
    label: "Battery Power (W)",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

interface BatteryChartProps {
  data: MicrogridReading[]
}

export function BatteryChart({ data }: BatteryChartProps) {
  const xProps = xAxisProps(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Over Time</CardTitle>
        <CardDescription>
          Battery power (W) showing charge and discharge cycles.
          Sign convention unconfirmed - see open questions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="battGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.02} />
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
            <ChartLegend content={<ChartLegendContent />} />
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
            <Area
              type="linear"
              dataKey="BattPow"
              stroke="var(--color-BattPow)"
              fill="url(#battGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
