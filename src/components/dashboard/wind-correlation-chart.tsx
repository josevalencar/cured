"use client"

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
import { Badge } from "@/components/ui/badge"
import type { ResearchReading } from "@/lib/types"
import { xAxisProps } from "@/lib/chart-utils"

const chartConfig = {
  wf_wind_mph: {
    label: "WeatherFlow wind (MPH)",
    color: "var(--chart-4)",
  },
  anemometer: {
    label: "Pi anemometer (MPH)",
    color: "var(--chart-3)",
  },
  HAWTrms: {
    label: "HAWT voltage (V)",
    color: "var(--clark-red)",
  },
  VAWTrms: {
    label: "VAWT voltage (V)",
    color: "var(--solar)",
  },
} satisfies ChartConfig

interface WindCorrelationChartProps {
  data: ResearchReading[]
}

/** Convert a compass bearing in degrees to a 16-point cardinal abbreviation. */
function cardinal(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE",
    "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW",
    "W", "WNW", "NW", "NNW",
  ]
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16
  return dirs[idx]
}

/**
 * Find the most recent reading where we have a WeatherFlow wind direction.
 * Weather data may have gaps; the very last row could be null.
 */
function latestWithDirection(
  data: ResearchReading[]
): { deg: number; mph: number | null } | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const d = data[i].wf_wind_direction
    if (d != null) {
      return { deg: d, mph: data[i].wf_wind_mph }
    }
  }
  return null
}

export function WindCorrelationChart({ data }: WindCorrelationChartProps) {
  const xProps = xAxisProps(data)
  const hasWeather = data.some(
    (r) => r.wf_wind_mph != null && r.wf_wind_mph > 0
  )
  const latest = latestWithDirection(data)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Wind & Turbine Correlation</CardTitle>
            <CardDescription>
              WeatherFlow station and Pi anemometer compared to turbine RMS
              output. Higher wind should lift HAWT and VAWT voltage.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {hasWeather ? "Live" : "Awaiting data"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart
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
              yAxisId="mph"
              orientation="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="var(--chart-4)"
              tickFormatter={(v: number) => `${v} mph`}
            />
            <YAxis
              yAxisId="volts"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              stroke="var(--clark-red)"
              tickFormatter={(v: number) => `${v.toFixed(1)} V`}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => {
                    if (value == null) return null
                    const n = Number(value)
                    if (name === "wf_wind_mph")
                      return [`${n.toFixed(1)} mph`, "WeatherFlow wind"]
                    if (name === "anemometer")
                      return [`${n.toFixed(1)} mph`, "Pi anemometer"]
                    if (name === "HAWTrms")
                      return [`${n.toFixed(2)} V`, "HAWT voltage"]
                    if (name === "VAWTrms")
                      return [`${n.toFixed(2)} V`, "VAWT voltage"]
                    return [String(value), String(name)]
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              yAxisId="mph"
              type="monotone"
              dataKey="wf_wind_mph"
              stroke="var(--chart-4)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              yAxisId="mph"
              type="monotone"
              dataKey="anemometer"
              stroke="var(--chart-3)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="volts"
              type="monotone"
              dataKey="HAWTrms"
              stroke="var(--clark-red)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
            <Line
              yAxisId="volts"
              type="monotone"
              dataKey="VAWTrms"
              stroke="var(--solar)"
              strokeWidth={2}
              dot={false}
              strokeDasharray="4 3"
            />
          </ComposedChart>
        </ChartContainer>
        {latest && (
          <p className="mt-3 text-xs text-muted-foreground">
            Latest wind direction:{" "}
            <span className="font-medium text-foreground">
              {Math.round(latest.deg)}° ({cardinal(latest.deg)})
            </span>
            {latest.mph != null && (
              <>
                {" "}at {latest.mph.toFixed(1)} mph
              </>
            )}
            . With turbine facing confirmed, favorable directions can be
            highlighted on this chart.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
