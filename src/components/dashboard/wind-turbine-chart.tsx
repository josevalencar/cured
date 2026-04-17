"use client"

import {
  Line,
  LineChart,
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { MicrogridReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  HAWTrms: {
    label: "HAWT (horizontal axis)",
    color: "var(--wind)",
  },
  VAWTrms: {
    label: "VAWT (vertical axis)",
    color: "var(--clark-red)",
  },
} satisfies ChartConfig

interface WindTurbineChartProps {
  data: MicrogridReading[]
}

export function WindTurbineChart({ data }: WindTurbineChartProps) {
  const xProps = xAxisProps(data)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wind Turbines</CardTitle>
        <CardDescription>
          RMS voltage (V) from horizontal and vertical axis turbines
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
              tickFormatter={(v: number) => `${v} V`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="HAWTrms"
              stroke="var(--wind)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="VAWTrms"
              stroke="var(--clark-red)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
