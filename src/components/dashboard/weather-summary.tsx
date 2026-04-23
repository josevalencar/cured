"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WeatherReading } from "@/lib/types"

interface WeatherSummaryProps {
  latest: WeatherReading | null
}

/** Convert millibar to mmHg (1 mb = 0.75006 mmHg). */
const MB_TO_MMHG = 0.75006

/** Compass bearing in degrees → 16-point cardinal abbreviation. */
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

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const secs = Math.max(0, Math.floor((now - then) / 1000))
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return new Date(iso).toLocaleDateString()
}

export function WeatherSummary({ latest }: WeatherSummaryProps) {
  if (!latest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weather Station</CardTitle>
          <CardDescription>
            Awaiting first reading from Clark Biophysics WeatherFlow station.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const {
    air_temperature,
    relative_humidity,
    wind_avg_mph,
    wind_gust_mph,
    wind_direction,
    solar_radiation,
    uv,
    conditions,
    sea_level_pressure,
    station_pressure,
  } = latest

  // Prefer sea-level pressure (matches the Tempest web UI's mmHg reading);
  // fall back to station pressure if the sea-level value is missing.
  const pressureMb = sea_level_pressure ?? station_pressure

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle>Weather Station — Clark Biophysics Roof</CardTitle>
            <CardDescription>
              Live observations from the Tempest sensor. Updated{" "}
              {formatRelativeTime(latest.recorded_at)}.
            </CardDescription>
          </div>
          <Badge variant="outline" className="shrink-0">
            {conditions ?? "—"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch">
          <div className="flex flex-col justify-center lg:w-48 lg:shrink-0 lg:border-r lg:pr-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-semibold tabular-nums">
                {air_temperature != null ? air_temperature.toFixed(0) : "—"}
              </span>
              <span className="text-2xl text-muted-foreground">°C</span>
            </div>
            {latest.conditions && (
              <p className="mt-1 text-sm text-muted-foreground">
                {latest.conditions}
              </p>
            )}
          </div>

          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-3">
            <Stat
              label="Humidity"
              value={
                relative_humidity != null
                  ? `${relative_humidity.toFixed(0)}%`
                  : "—"
              }
            />
            <Stat
              label="Pressure"
              value={
                pressureMb != null
                  ? `${(pressureMb * MB_TO_MMHG).toFixed(1)} mmHg`
                  : "—"
              }
            />
            <Stat
              label="Wind"
              value={
                wind_avg_mph != null
                  ? `${wind_avg_mph.toFixed(1)} mph`
                  : "—"
              }
              sub={
                wind_direction != null
                  ? `${Math.round(wind_direction)}° ${cardinal(wind_direction)}`
                  : undefined
              }
            />
            <Stat
              label="Gust"
              value={
                wind_gust_mph != null
                  ? `${wind_gust_mph.toFixed(1)} mph`
                  : "—"
              }
            />
            <Stat
              label="UV Index"
              value={uv != null ? uv.toFixed(0) : "—"}
            />
            <Stat
              label="Solar Radiation"
              value={
                solar_radiation != null
                  ? `${solar_radiation.toFixed(0)} W/m²`
                  : "—"
              }
            />
          </dl>
        </div>
      </CardContent>
    </Card>
  )
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-medium tabular-nums">
        {value}
        {sub && (
          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
            {sub}
          </span>
        )}
      </dd>
    </div>
  )
}
