export type DateRange = "today" | "week" | "month"

export interface MicrogridReading {
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

export interface DerivedMetrics {
  solarEnergyKwh: number
  co2AvoidedKg: number
  batteryStatus: "Charging" | "Discharging" | "Idle"
  systemOnline: boolean
  currentSolarPower: number
  currentBatteryVoltage: number
}

/** EPA eGRID average US grid emissions factor (kg CO₂ per kWh) */
export const EPA_EMISSIONS_FACTOR = 0.386

/** Noise threshold for battery current (A) — below this magnitude, treat as idle */
export const BATTERY_CURRENT_THRESHOLD = 0.5

/** Noise threshold for solar power (W) — below this, treat as zero */
export const SOLAR_POWER_THRESHOLD = 5
