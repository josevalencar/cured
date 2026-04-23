import { supabase } from "./supabase"
import type { DateRange, WeatherReading } from "./types"

/**
 * Database row shape from the Supabase `weather_readings` table.
 * Populated every minute by /api/cron/fetch-weather from the
 * WeatherFlow /better_forecast endpoint.
 */
interface WeatherRow {
  recorded_at: string
  station_id: number
  air_temperature: number | null
  feels_like: number | null
  dew_point: number | null
  relative_humidity: number | null
  station_pressure: number | null
  sea_level_pressure: number | null
  wind_avg: number | null // m/s
  wind_gust: number | null // m/s
  wind_direction: number | null
  solar_radiation: number | null
  uv: number | null
  conditions: string | null
}

/** WeatherFlow reports wind in m/s; our dashboard uses MPH (for parity with the Pi anemometer). */
const MS_TO_MPH = 2.23693629

const COLUMNS =
  "recorded_at, station_id, air_temperature, feels_like, dew_point, relative_humidity, station_pressure, sea_level_pressure, wind_avg, wind_gust, wind_direction, solar_radiation, uv, conditions"

function rowToReading(row: WeatherRow): WeatherReading {
  return {
    recorded_at: row.recorded_at,
    station_id: row.station_id,
    air_temperature: row.air_temperature,
    feels_like: row.feels_like,
    dew_point: row.dew_point,
    relative_humidity: row.relative_humidity,
    station_pressure: row.station_pressure,
    sea_level_pressure: row.sea_level_pressure,
    wind_avg_mph:
      row.wind_avg == null ? null : row.wind_avg * MS_TO_MPH,
    wind_gust_mph:
      row.wind_gust == null ? null : row.wind_gust * MS_TO_MPH,
    wind_direction: row.wind_direction,
    solar_radiation: row.solar_radiation,
    uv: row.uv,
    conditions: row.conditions,
  }
}

function rangeStartDate(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case "today":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    case "week": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      d.setDate(d.getDate() - 7)
      return d
    }
    case "month": {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      d.setDate(d.getDate() - 30)
      return d
    }
  }
}

/**
 * Fetch weather readings from Supabase for a given range.
 * Mirrors fetchReadings() in microgrid-data.ts — parallel pagination
 * to get around the 1000-row default Supabase limit.
 */
export async function fetchWeatherReadings(
  range: DateRange
): Promise<WeatherReading[]> {
  const start = rangeStartDate(range).toISOString()

  if (range === "today") {
    const [page1, page2] = await Promise.all([
      supabase
        .from("weather_readings")
        .select(COLUMNS)
        .gte("recorded_at", start)
        .order("recorded_at", { ascending: true })
        .range(0, 999),
      supabase
        .from("weather_readings")
        .select(COLUMNS)
        .gte("recorded_at", start)
        .order("recorded_at", { ascending: true })
        .range(1000, 1999),
    ])

    if (page1.error) {
      console.error("Supabase weather query error:", page1.error.message)
      return []
    }

    const rows = [
      ...(page1.data as WeatherRow[]),
      ...((page2.data as WeatherRow[]) ?? []),
    ]
    return rows.map(rowToReading)
  }

  const { count, error: countError } = await supabase
    .from("weather_readings")
    .select("recorded_at", { count: "exact", head: true })
    .gte("recorded_at", start)

  if (countError || count === null) {
    console.error("Supabase weather count error:", countError?.message)
    return []
  }

  if (count === 0) return []

  const PAGE_SIZE = 1000
  const pageCount = Math.ceil(count / PAGE_SIZE)

  const pagePromises = Array.from({ length: pageCount }, (_, i) => {
    const from = i * PAGE_SIZE
    return supabase
      .from("weather_readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .order("recorded_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
  })

  const pages = await Promise.all(pagePromises)

  const allRows: WeatherRow[] = []
  for (const page of pages) {
    if (page.error) {
      console.error("Supabase weather page error:", page.error.message)
      continue
    }
    allRows.push(...(page.data as WeatherRow[]))
  }

  return allRows.map(rowToReading)
}

/**
 * Fetch weather readings for a single calendar day (midnight-to-midnight, local time).
 */
export async function fetchWeatherReadingsForDate(
  dateISO: string
): Promise<WeatherReading[]> {
  const [y, m, d] = dateISO.split("-").map(Number)
  if (!y || !m || !d) return []
  const start = new Date(y, m - 1, d, 0, 0, 0).toISOString()
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()

  const [page1, page2] = await Promise.all([
    supabase
      .from("weather_readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .lte("recorded_at", end)
      .order("recorded_at", { ascending: true })
      .range(0, 999),
    supabase
      .from("weather_readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .lte("recorded_at", end)
      .order("recorded_at", { ascending: true })
      .range(1000, 1999),
  ])

  if (page1.error) {
    console.error("Supabase weather query error:", page1.error.message)
    return []
  }

  const rows = [
    ...(page1.data as WeatherRow[]),
    ...((page2.data as WeatherRow[]) ?? []),
  ]
  return rows.map(rowToReading)
}
