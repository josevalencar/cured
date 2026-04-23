import {
  type MicrogridReading,
  type DerivedMetrics,
  EPA_EMISSIONS_FACTOR,
  BATTERY_CURRENT_THRESHOLD,
  SOLAR_POWER_THRESHOLD,
} from "./types"

/**
 * Generate a realistic 24-hour mock dataset for the Clark microgrid.
 *
 * Values are modeled on the PowCrv file format (27 columns, 1 reading/minute)
 * but sampled at 15-minute intervals (96 points) for chart clarity.
 *
 * Solar power follows a bell curve peaking ~800W around 12:30 PM.
 * Battery charges during peak solar, discharges in evening.
 * AC grid imports at night and exports during peak solar.
 * Wind turbines produce small, variable output.
 * Anemometer reads zero (Pi network issue — see CLAUDE.md).
 */
function generateMockData(): MicrogridReading[] {
  seed = 42
  const data: MicrogridReading[] = []
  const baseDate = new Date()
  baseDate.setHours(0, 0, 0, 0)

  for (let i = 0; i < 96; i++) {
    const hour = i * 0.25
    const hourInt = Math.floor(hour)
    const minutes = (hour % 1) * 60
    const timeStr = `${String(hourInt).padStart(2, "0")}:${String(Math.round(minutes)).padStart(2, "0")}`

    const stamp = new Date(baseDate)
    stamp.setHours(hourInt, Math.round(minutes), 0, 0)

    const solarFraction = solarProfile(hour)
    const pvPow = solarFraction * 820 + noise(2)
    const pvVolts = solarFraction > 0.02 ? 48 + solarFraction * 8 + noise(0.5) : noise(0.4)
    const pvCur = pvVolts > 5 ? pvPow / pvVolts : noise(0.05)

    const battCurr = batteryProfile(hour) + noise(0.1)
    const battV = 186 + battCurr * 0.3 + noise(0.15)
    const battPow = battV * battCurr

    const vawtRms = windProfile(hour, 0.8) + noise(0.05)
    const hawtRms = windProfile(hour, 1.2) + noise(0.08)

    const acPow = acGridProfile(hour, pvPow) + noise(3)
    const acVolts = 123 + noise(1.5)
    const acCurr = acVolts > 0 ? acPow / acVolts : 0

    data.push({
      recorded_at: stamp.toISOString(),
      time: timeStr,
      label: timeStr,
      hour,
      PVvolts: clampNoise(pvVolts, SOLAR_POWER_THRESHOLD),
      PVcur: pvVolts > 5 ? Math.max(0, pvCur) : 0,
      PVpow: clampNoise(pvPow, SOLAR_POWER_THRESHOLD),
      BattV: battV,
      BattCurr: battCurr,
      BattPow: battPow,
      VAWTrms: Math.max(0, vawtRms),
      HAWTrms: Math.max(0, hawtRms),
      acPower: acPow,
      ACVolts: acVolts,
      ACCurr: acCurr,
      anemometer: 0,
    })
  }

  return data
}

/** Bell-curve solar irradiance profile: sunrise ~6:30, sunset ~17:00, peak ~12:30 */
function solarProfile(hour: number): number {
  if (hour < 6.5 || hour > 17) return 0
  const center = 12.5
  const sigma = 2.8
  return Math.exp(-Math.pow(hour - center, 2) / (2 * sigma * sigma))
}

/** Battery current: positive = charging during solar peak, negative = discharging evening */
function batteryProfile(hour: number): number {
  if (hour >= 9 && hour <= 15) {
    const center = 12.5
    const sigma = 2
    return 3.5 * Math.exp(-Math.pow(hour - center, 2) / (2 * sigma * sigma))
  }
  if (hour >= 17 && hour <= 22) {
    const center = 19.5
    const sigma = 1.5
    return -2.0 * Math.exp(-Math.pow(hour - center, 2) / (2 * sigma * sigma))
  }
  return 0
}

/** Small, variable wind turbine output */
function windProfile(hour: number, scale: number): number {
  const base = 0.3 * scale
  const variation = 0.5 * scale * Math.sin(hour * 0.7) * Math.cos(hour * 1.3)
  return Math.max(0, base + variation)
}

/** AC grid: negative = importing. Less import during solar peak, more at night */
function acGridProfile(hour: number, solarPow: number): number {
  const baseLoad = -160
  const solarOffset = solarPow * 0.15
  return baseLoad + solarOffset
}

/** Deterministic PRNG to avoid server/client hydration mismatches */
let seed = 42
function seededRandom(): number {
  seed = (seed * 16807 + 0) % 2147483647
  return (seed - 1) / 2147483646
}

function noise(amplitude: number): number {
  return (seededRandom() - 0.5) * 2 * amplitude
}

function clampNoise(value: number, threshold: number): number {
  return Math.abs(value) < threshold ? 0 : value
}

/** Compute derived metrics from a day of readings */
export function computeMetrics(data: MicrogridReading[]): DerivedMetrics {
  const intervalHours = 0.25
  let totalSolarWh = 0

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
  else if (latestBattCurr < -BATTERY_CURRENT_THRESHOLD) batteryStatus = "Discharging"

  const systemOnline = data.some((r) => r.PVpow > SOLAR_POWER_THRESHOLD || Math.abs(r.acPower) > 10)

  return {
    solarEnergyKwh,
    co2AvoidedKg,
    batteryStatus,
    systemOnline,
    currentSolarPower: latest?.PVpow ?? 0,
    currentBatteryVoltage: latest?.BattV ?? 0,
  }
}

let cachedData: MicrogridReading[] | null = null

export function getMockData(): MicrogridReading[] {
  if (!cachedData) {
    cachedData = generateMockData()
  }
  return cachedData
}
