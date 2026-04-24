export type DateRange = "today" | "week" | "month"

export interface MicrogridReading {
  /** Absolute ISO timestamp — source of truth for joining with other datasets. */
  recorded_at: string
  time: string
  /** Display label for the x-axis — "HH:MM" for today, "Mon DD HH:MM" for longer ranges */
  label: string
  hour: number
  PVvolts: number
  PVcur: number
  PVpow: number
  BattV: number
  BattCurr: number
  BattPow: number
  VAWTrms: number
  HAWTrms: number
  acPower: number
  ACVolts: number
  ACCurr: number
  anemometer: number
}

/** A single row from the Supabase `weather_readings` table, post-conversion. */
export interface WeatherReading {
  recorded_at: string
  station_id: number
  air_temperature: number | null
  feels_like: number | null
  dew_point: number | null
  relative_humidity: number | null
  /** Pressure at the station elevation, millibar. */
  station_pressure: number | null
  /** Pressure adjusted to sea level, millibar. */
  sea_level_pressure: number | null
  /** Wind speed in MPH (converted from WeatherFlow's m/s at fetch time). */
  wind_avg_mph: number | null
  wind_gust_mph: number | null
  /** Compass degrees, 0 = N, 90 = E. */
  wind_direction: number | null
  solar_radiation: number | null
  uv: number | null
  conditions: string | null
}

/**
 * A MicrogridReading merged with the corresponding WeatherFlow row
 * (matched by minute-level timestamp). Used by the research view for
 * cross-reference charts. Weather fields are null when no weather row
 * exists for that minute (e.g., cron gap, or data before the cron started).
 */
export interface ResearchReading extends MicrogridReading {
  wf_wind_mph: number | null
  wf_wind_direction: number | null
}

export interface DerivedMetrics {
  solarEnergyKwh: number
  co2AvoidedKg: number
  batteryStatus: "Charging" | "Discharging" | "Idle"
  systemOnline: boolean
  currentSolarPower: number
  currentBatteryVoltage: number
  /** Latest HAWT (horizontal-axis) RMS voltage, V. */
  currentHAWT: number
  /** Latest VAWT (vertical-axis) RMS voltage, V. */
  currentVAWT: number
}

/** EPA eGRID average US grid emissions factor (kg CO₂ per kWh) */
export const EPA_EMISSIONS_FACTOR = 0.386

/** Noise threshold for battery current (A) — below this magnitude, treat as idle */
export const BATTERY_CURRENT_THRESHOLD = 0.5

/** Noise threshold for solar power (W) — below this, treat as zero */
export const SOLAR_POWER_THRESHOLD = 5
