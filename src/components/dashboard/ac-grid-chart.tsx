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
} from "@/components/ui/chart"
import type { MicrogridReading } from "@/lib/types"

const chartConfig = {
  acPower: {
    label: "AC Power (W)",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

interface AcGridChartProps {
  data: MicrogridReading[]
}

export function AcGridChart({ data }: AcGridChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AC Grid Flow</CardTitle>
        <CardDescription>
          Grid power over time. Sign convention unconfirmed - negative values
          shown as-is until verified with Professor Agosta.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gridGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              interval={7}
              fontSize={11}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={11}
              tickFormatter={(v: number) => `${v}W`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
            <Area
              type="linear"
              dataKey="acPower"
              stroke="var(--color-acPower)"
              fill="url(#gridGrad)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
