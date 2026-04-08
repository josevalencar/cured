import type { MicrogridReading } from "./types"

/**
 * Target maximum number of data points to render in a chart.
 * Above this, we aggregate into time buckets.
 */
const MAX_CHART_POINTS = 500

/**
 * Downsample an array of readings by averaging values in equal-sized time buckets.
 * If the data already has fewer points than MAX_CHART_POINTS, returns it unchanged.
 *
 * The bucket size adapts to the data range:
 *   - 1 day  (~1440 pts) → 5-min buckets  → ~288 pts
 *   - 1 week (~10080 pts) → 15-min buckets → ~672 pts
 *   - 1 month (~43200 pts) → 1-hour buckets → ~720 pts
 */
export function downsample(data: MicrogridReading[]): MicrogridReading[] {
  if (data.length <= MAX_CHART_POINTS) return data

  const bucketSize = Math.ceil(data.length / MAX_CHART_POINTS)

  const result: MicrogridReading[] = []

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize)
    result.push(averageBucket(bucket))
  }

  return result
}

/** Average all numeric fields in a bucket, keeping the middle timestamp. */
function averageBucket(bucket: MicrogridReading[]): MicrogridReading {
  const n = bucket.length
  const mid = bucket[Math.floor(n / 2)]

  let PVvolts = 0, PVcur = 0, PVpow = 0
  let BattV = 0, BattCurr = 0, BattPow = 0
  let VAWTrms = 0, HAWTrms = 0
  let acPower = 0, ACVolts = 0, ACCurr = 0
  let anemometer = 0

  for (const r of bucket) {
    PVvolts += r.PVvolts
    PVcur += r.PVcur
    PVpow += r.PVpow
    BattV += r.BattV
    BattCurr += r.BattCurr
    BattPow += r.BattPow
    VAWTrms += r.VAWTrms
    HAWTrms += r.HAWTrms
    acPower += r.acPower
    ACVolts += r.ACVolts
    ACCurr += r.ACCurr
    anemometer += r.anemometer
  }

  return {
    time: mid.time,
    label: mid.label,
    hour: mid.hour,
    PVvolts: PVvolts / n,
    PVcur: PVcur / n,
    PVpow: PVpow / n,
    BattV: BattV / n,
    BattCurr: BattCurr / n,
    BattPow: BattPow / n,
    VAWTrms: VAWTrms / n,
    HAWTrms: HAWTrms / n,
    acPower: acPower / n,
    ACVolts: ACVolts / n,
    ACCurr: ACCurr / n,
    anemometer: anemometer / n,
  }
}
