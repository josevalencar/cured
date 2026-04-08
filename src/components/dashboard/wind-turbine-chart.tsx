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
    label: "HAWT RMS (V)",
    color: "var(--chart-3)",
  },
  VAWTrms: {
    label: "VAWT RMS (V)",
    color: "var(--chart-5)",
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
        <CardTitle>HAWT vs. VAWT</CardTitle>
        <CardDescription>
          Horizontal and vertical axis wind turbine RMS voltage - two
          fundamentally different turbine architectures compared side by side
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
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
              tickFormatter={(v: number) => `${v}V`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="linear"
              dataKey="HAWTrms"
              stroke="var(--color-HAWTrms)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="linear"
              dataKey="VAWTrms"
              stroke="var(--color-VAWTrms)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
