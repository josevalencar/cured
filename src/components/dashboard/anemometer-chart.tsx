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
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import type { MicrogridReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  anemometer: {
    label: "Wind Speed (MPH)",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig

interface AnemometerChartProps {
  data: MicrogridReading[]
}

export function AnemometerChart({ data }: AnemometerChartProps) {
  const xProps = xAxisProps(data)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Wind Speed</CardTitle>
            <CardDescription>
              Anemometer readings in MPH from the Raspberry Pi subsystem
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            No data — Pi network issue
          </Badge>
        </div>
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
              domain={[0, 30]}
              tickFormatter={(v: number) => `${v}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              type="linear"
              dataKey="anemometer"
              stroke="var(--color-anemometer)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
        <p className="mt-3 text-xs text-muted-foreground">
          The Raspberry Pi running AnemometerMPH22.py is currently on a
          different Wi-Fi network than the iMac. This chart will populate
          automatically once the network issue is resolved.
        </p>
      </CardContent>
    </Card>
  )
}
