import { supabase } from "./supabase"
import type { MicrogridReading, DerivedMetrics } from "./types"
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

/** Convert a Supabase row into the MicrogridReading the frontend expects. */
function rowToReading(row: ReadingsRow): MicrogridReading {
  const date = new Date(row.recorded_at)
  const hour = date.getHours() + date.getMinutes() / 60
  const timeStr =
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0")

  return {
    time: timeStr,
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

/**
 * Fetch today's readings from Supabase.
 *
 * Queries all rows where recorded_at is today (UTC), ordered by time.
 * Returns them mapped to MicrogridReading[].
 */
export async function fetchTodayReadings(): Promise<MicrogridReading[]> {
  const today = new Date()
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  ).toISOString()

  const { data, error } = await supabase
    .from("readings")
    .select(
      "id, recorded_at, pv_volts, pv_cur, pv_pow, batt_v, batt_curr, batt_pow, vawt_rms, hawt_rms, ac_power, ac_volts, ac_curr, anemometer, date_s, time_s"
    )
    .gte("recorded_at", startOfDay)
    .order("recorded_at", { ascending: true })

  if (error) {
    console.error("Supabase query error:", error.message)
    return []
  }

  return (data as ReadingsRow[]).map(rowToReading)
}

/** Compute derived metrics from real readings (same logic as mock-data.ts). */
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
