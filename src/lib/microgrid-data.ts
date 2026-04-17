import { supabase } from "./supabase"
import type { MicrogridReading, DerivedMetrics, DateRange } from "./types"
import {
  EPA_EMISSIONS_FACTOR,
  BATTERY_CURRENT_THRESHOLD,
  SOLAR_POWER_THRESHOLD,
} from "./types"

/**
 * Database row shape from the Supabase `readings` table.
 * Column names use snake_case (Postgres convention).
 */
interface ReadingsRow {
  id: number
  recorded_at: string
  pv_volts: number
  pv_cur: number
  pv_pow: number
  batt_v: number
  batt_curr: number
  batt_pow: number
  vawt_rms: number
  hawt_rms: number
  ac_power: number
  ac_volts: number
  ac_curr: number
  anemometer: number
  date_s: number
  time_s: number
}

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

/** Convert a Supabase row into the MicrogridReading the frontend expects. */
function rowToReading(row: ReadingsRow, range: DateRange): MicrogridReading {
  const date = new Date(row.recorded_at)
  const hour = date.getHours() + date.getMinutes() / 60
  const hh = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  const timeStr = `${hh}:${mm}`

  // "today" → "HH:MM" on x-axis
  // "week"/"month" → "Mon DD" on x-axis (time goes in tooltip only)
  const mon = SHORT_MONTHS[date.getMonth()]
  const day = date.getDate()
  let label: string
  if (range === "today") {
    label = timeStr
  } else {
    label = `${mon} ${day}`
  }

  return {
    time: timeStr,
    label,
    hour,
    PVvolts: row.pv_volts,
    PVcur: row.pv_cur,
    PVpow: row.pv_pow,
    BattV: row.batt_v,
    BattCurr: row.batt_curr,
    BattPow: row.batt_pow,
    VAWTrms: row.vawt_rms,
    HAWTrms: row.hawt_rms,
    acPower: row.ac_power,
    ACVolts: row.ac_volts,
    ACCurr: row.ac_curr,
    anemometer: row.anemometer,
  }
}

/** Compute the start-of-range Date for a given DateRange. */
function rangeStartDate(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case "today": {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    }
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

const COLUMNS =
  "id, recorded_at, pv_volts, pv_cur, pv_pow, batt_v, batt_curr, batt_pow, vawt_rms, hawt_rms, ac_power, ac_volts, ac_curr, anemometer, date_s, time_s"

/**
 * Fetch readings from Supabase for a given date range.
 *
 * Supabase caps responses at 1000 rows by default.
 * For longer ranges we first get the total count, then fetch all pages
 * in parallel to avoid slow sequential pagination.
 */
export async function fetchReadings(
  range: DateRange
): Promise<MicrogridReading[]> {
  const start = rangeStartDate(range).toISOString()

  // A full day has up to 1440 rows (24h × 60min), but Supabase's
  // default limit is 1000. Fetch both halves in parallel.
  if (range === "today") {
    const [page1, page2] = await Promise.all([
      supabase
        .from("readings")
        .select(COLUMNS)
        .gte("recorded_at", start)
        .order("recorded_at", { ascending: true })
        .range(0, 999),
      supabase
        .from("readings")
        .select(COLUMNS)
        .gte("recorded_at", start)
        .order("recorded_at", { ascending: true })
        .range(1000, 1999),
    ])

    if (page1.error) {
      console.error("Supabase query error:", page1.error.message)
      return []
    }

    const rows = [
      ...(page1.data as ReadingsRow[]),
      ...((page2.data as ReadingsRow[]) ?? []),
    ]
    return rows.map((r) => rowToReading(r, range))
  }

  // For longer ranges: get total count first, then fetch all pages in parallel
  const { count, error: countError } = await supabase
    .from("readings")
    .select("id", { count: "exact", head: true })
    .gte("recorded_at", start)

  if (countError || count === null) {
    console.error("Supabase count error:", countError?.message)
    return []
  }

  if (count === 0) return []

  const PAGE_SIZE = 1000
  const pageCount = Math.ceil(count / PAGE_SIZE)

  // Fire all page requests in parallel
  const pagePromises = Array.from({ length: pageCount }, (_, i) => {
    const from = i * PAGE_SIZE
    return supabase
      .from("readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .order("recorded_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)
  })

  const pages = await Promise.all(pagePromises)

  const allRows: ReadingsRow[] = []
  for (const page of pages) {
    if (page.error) {
      console.error("Supabase page error:", page.error.message)
      continue
    }
    allRows.push(...(page.data as ReadingsRow[]))
  }

  return allRows.map((r) => rowToReading(r, range))
}

/** Backward-compatible alias — fetches today's readings. */
export async function fetchTodayReadings(): Promise<MicrogridReading[]> {
  return fetchReadings("today")
}

/**
 * Fetch readings for a single calendar day (midnight-to-midnight, local time).
 * `dateISO` is the "YYYY-MM-DD" string from an <input type="date">.
 */
export async function fetchReadingsForDate(
  dateISO: string
): Promise<MicrogridReading[]> {
  const [y, m, d] = dateISO.split("-").map(Number)
  if (!y || !m || !d) return []
  const start = new Date(y, m - 1, d, 0, 0, 0).toISOString()
  const end = new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()

  const [page1, page2] = await Promise.all([
    supabase
      .from("readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .lte("recorded_at", end)
      .order("recorded_at", { ascending: true })
      .range(0, 999),
    supabase
      .from("readings")
      .select(COLUMNS)
      .gte("recorded_at", start)
      .lte("recorded_at", end)
      .order("recorded_at", { ascending: true })
      .range(1000, 1999),
  ])

  if (page1.error) {
    console.error("Supabase query error:", page1.error.message)
    return []
  }

  const rows = [
    ...(page1.data as ReadingsRow[]),
    ...((page2.data as ReadingsRow[]) ?? []),
  ]
  return rows.map((r) => rowToReading(r, "today"))
}

/** Compute derived metrics from readings. */
export function computeMetrics(data: MicrogridReading[]): DerivedMetrics {
  let totalSolarWh = 0

  // Each reading is ~1 minute apart, so interval = 1/60 hours
  const intervalHours = 1 / 60

  for (const row of data) {
    if (row.PVpow > SOLAR_POWER_THRESHOLD) {
      totalSolarWh += row.PVpow * intervalHours
    }
  }

  const solarEnergyKwh = totalSolarWh / 1000
  const co2AvoidedKg = solarEnergyKwh * EPA_EMISSIONS_FACTOR

  const latest = data[data.length - 1]
  const latestBattCurr = latest?.BattCurr ?? 0
  let batteryStatus: DerivedMetrics["batteryStatus"] = "Idle"
  if (latestBattCurr > BATTERY_CURRENT_THRESHOLD) batteryStatus = "Charging"
  else if (latestBattCurr < -BATTERY_CURRENT_THRESHOLD)
    batteryStatus = "Discharging"

  const systemOnline = data.some(
    (r) => r.PVpow > SOLAR_POWER_THRESHOLD || Math.abs(r.acPower) > 10
  )

  return {
    solarEnergyKwh,
    co2AvoidedKg,
    batteryStatus,
    systemOnline,
    currentSolarPower: latest?.PVpow ?? 0,
    currentBatteryVoltage: latest?.BattV ?? 0,
  }
}
