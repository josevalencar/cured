"use client"

import {
  Line,
  LineChart,
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
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  BattPow: {
    label: "Battery Power (W)",
    color: "var(--battery)",
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
        <CardTitle>Battery</CardTitle>
        <CardDescription>
          Charge and discharge power (W) — positive = charging
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[300px] w-full"
        >
          <LineChart
            data={data}
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
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="var(--muted-foreground)"
              tickFormatter={(v: number) => `${v} W`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ReferenceLine
              y={0}
              stroke="var(--rule)"
              strokeOpacity={0.4}
              strokeDasharray="2 4"
            />
            <Line
              type="monotone"
              dataKey="BattPow"
              stroke="var(--battery)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
