"use client"

import { useMemo } from "react"
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
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

/** Compass heading the HAWT/VAWT turbines face (Professor Agosta, 2026-04-23). */
const TURBINE_FACING_DEG = 0 // North
/** Half-width of the "favorable" wind cone centered on the turbine facing. */
const FAVORABLE_TOLERANCE_DEG = 45

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

/** Shortest angular distance between two compass bearings, in degrees. */
function angularDistance(a: number, b: number): number {
  const diff = Math.abs(((a - b) % 360) + 360) % 360
  return Math.min(diff, 360 - diff)
}

/** Wind direction is "favorable" when within the tolerance of the turbine facing. */
function isFavorable(deg: number | null | undefined): boolean {
  if (deg == null) return false
  return angularDistance(deg, TURBINE_FACING_DEG) <= FAVORABLE_TOLERANCE_DEG
}

/**
 * Compute contiguous x-ranges of favorable wind, expressed as XAxis label pairs.
 * Used to render <ReferenceArea> shading on the chart.
 */
function favorableWindows(
  data: ResearchReading[]
): Array<{ x1: string; x2: string }> {
  const windows: Array<{ x1: string; x2: string }> = []
  let start: number | null = null
  for (let i = 0; i < data.length; i++) {
    const good = isFavorable(data[i].wf_wind_direction)
    if (good && start === null) start = i
    if (!good && start !== null) {
      windows.push({ x1: data[start].label, x2: data[i - 1].label })
      start = null
    }
  }
  if (start !== null) {
    windows.push({ x1: data[start].label, x2: data[data.length - 1].label })
  }
  return windows
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
  const windows = useMemo(() => favorableWindows(data), [data])
  const latestFavorable = latest ? isFavorable(latest.deg) : false

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
            {windows.map((w, i) => (
              <ReferenceArea
                key={`fav-${i}`}
                yAxisId="mph"
                x1={w.x1}
                x2={w.x2}
                fill="var(--battery)"
                fillOpacity={0.08}
                stroke="none"
                ifOverflow="hidden"
              />
            ))}
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
        <p className="mt-3 text-xs text-muted-foreground">
          {latest ? (
            <>
              Latest wind:{" "}
              <span className="font-medium text-foreground">
                {Math.round(latest.deg)}° ({cardinal(latest.deg)})
              </span>
              {latest.mph != null && <> at {latest.mph.toFixed(1)} mph</>}
              .{" "}
            </>
          ) : null}
          Turbines face{" "}
          <span className="font-medium text-foreground">
            N (0°)
          </span>
          ; the green bands mark wind within ±{FAVORABLE_TOLERANCE_DEG}° of that
          heading — the window where turbine RMS output should respond most
          strongly.{" "}
          {latest && (
            <span
              className={
                latestFavorable
                  ? "font-medium text-[var(--battery)]"
                  : "font-medium text-foreground"
              }
            >
              {latestFavorable
                ? "Current wind is on-axis."
                : "Current wind is off-axis."}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  )
}
