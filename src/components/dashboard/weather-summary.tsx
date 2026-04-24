"use client"

import type { ComponentType, SVGProps } from "react"
import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Compass,
  Droplets,
  Gauge,
  Moon,
  Sun,
  SunMedium,
  Wind,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WeatherReading } from "@/lib/types"

type LucideIcon = ComponentType<SVGProps<SVGSVGElement>>

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

/** Approximate day/night from the observation's local hour. */
function isNightAt(iso: string): boolean {
  const h = new Date(iso).getHours()
  return h < 6 || h >= 20
}

/** Map WeatherFlow's `conditions` text to a Lucide weather icon. */
function conditionsIcon(
  conditions: string | null,
  iso: string
): LucideIcon {
  const night = isNightAt(iso)
  const text = (conditions ?? "").toLowerCase()

  if (text.includes("thunder") || text.includes("lightning"))
    return CloudLightning
  if (text.includes("snow")) return CloudSnow
  if (text.includes("drizzle") || text.includes("rain possible"))
    return CloudDrizzle
  if (text.includes("rain")) return CloudRain
  if (text.includes("fog") || text.includes("mist") || text.includes("haze"))
    return CloudFog
  if (text.includes("partly")) return night ? CloudMoon : CloudSun
  if (text.includes("cloud")) return Cloud
  if (text.includes("clear") || text.includes("sunny") || text === "")
    return night ? Moon : Sun

  return night ? CloudMoon : CloudSun
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

  const pressureMb = sea_level_pressure ?? station_pressure
  const ConditionIcon = conditionsIcon(conditions, latest.recorded_at)

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
          <div className="flex items-center justify-between gap-4 lg:w-56 lg:shrink-0 lg:border-r lg:pr-6">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-semibold tabular-nums">
                  {air_temperature != null ? air_temperature.toFixed(0) : "—"}
                </span>
                <span className="text-2xl text-muted-foreground">°C</span>
              </div>
              {conditions && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {conditions}
                </p>
              )}
            </div>
            <ConditionIcon
              className="h-16 w-16 shrink-0 text-[var(--chart-4)]"
              strokeWidth={1.5}
              aria-hidden
            />
          </div>

          <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-3">
            <Stat
              icon={Droplets}
              label="Humidity"
              value={
                relative_humidity != null
                  ? `${relative_humidity.toFixed(0)}%`
                  : "—"
              }
            />
            <Stat
              icon={Gauge}
              label="Pressure"
              value={
                pressureMb != null
                  ? `${(pressureMb * MB_TO_MMHG).toFixed(1)} mmHg`
                  : "—"
              }
            />
            <Stat
              icon={Compass}
              iconRotateDeg={wind_direction ?? undefined}
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
              icon={Wind}
              label="Gust"
              value={
                wind_gust_mph != null
                  ? `${wind_gust_mph.toFixed(1)} mph`
                  : "—"
              }
            />
            <Stat
              icon={Sun}
              label="UV Index"
              value={uv != null ? uv.toFixed(0) : "—"}
            />
            <Stat
              icon={SunMedium}
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
  icon: Icon,
  label,
  value,
  sub,
  iconRotateDeg,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  /** For the wind stat — rotates the icon to the wind direction. */
  iconRotateDeg?: number
}) {
  const rotateStyle =
    iconRotateDeg != null
      ? { transform: `rotate(${iconRotateDeg}deg)` }
      : undefined
  return (
    <div className="flex items-start gap-2.5">
      <Icon
        className="mt-1 h-4 w-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        style={rotateStyle}
        aria-hidden
      />
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
    </div>
  )
}
