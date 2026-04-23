"use client"

import { useCallback, useEffect, useState } from "react"
import {
  computeMetrics,
  fetchReadings,
  fetchReadingsForDate,
} from "./microgrid-data"
import {
  fetchWeatherReadings,
  fetchWeatherReadingsForDate,
} from "./weather-data"
import { downsample } from "./downsample"
import type {
  DateRange,
  DerivedMetrics,
  MicrogridReading,
  ResearchReading,
  WeatherReading,
} from "./types"

export interface ResearchSelection {
  range: DateRange
  date?: string | null
}

export interface UseResearchDataResult {
  selection: ResearchSelection
  setSelection: (sel: ResearchSelection) => void
  rawData: ResearchReading[]
  chartData: ResearchReading[]
  metrics: DerivedMetrics | null
  /** Most recent WeatherFlow row (all fields, not just the merged subset). */
  latestWeather: WeatherReading | null
  isLive: boolean
  loading: boolean
  reload: () => void
}

/**
 * Merge microgrid and weather readings by minute-level timestamp.
 * The microgrid readings are the "spine" — we produce one ResearchReading
 * per microgrid reading, with weather fields null where no matching
 * weather row exists for that minute.
 */
function mergeByMinute(
  micro: MicrogridReading[],
  weather: WeatherReading[]
): ResearchReading[] {
  const idx = new Map<string, WeatherReading>()
  for (const w of weather) {
    // "2026-04-23T14:30:00.000Z" -> "2026-04-23T14:30"
    idx.set(w.recorded_at.slice(0, 16), w)
  }

  return micro.map((m) => {
    const w = idx.get(m.recorded_at.slice(0, 16))
    return {
      ...m,
      wf_wind_mph: w?.wind_avg_mph ?? null,
      wf_wind_direction: w?.wind_direction ?? null,
    }
  })
}

function zeroReadingsForDate(dateISO?: string | null): ResearchReading[] {
  const base = dateISO ? new Date(dateISO + "T00:00:00") : new Date()
  base.setHours(0, 0, 0, 0)

  return Array.from({ length: 24 }, (_, h) => {
    const hh = String(h).padStart(2, "0")
    const stamp = new Date(base)
    stamp.setHours(h, 0, 0, 0)
    return {
      recorded_at: stamp.toISOString(),
      time: `${hh}:00`,
      label: `${hh}:00`,
      hour: h,
      PVvolts: 0,
      PVcur: 0,
      PVpow: 0,
      BattV: 0,
      BattCurr: 0,
      BattPow: 0,
      VAWTrms: 0,
      HAWTrms: 0,
      acPower: 0,
      ACVolts: 0,
      ACCurr: 0,
      anemometer: 0,
      wf_wind_mph: null,
      wf_wind_direction: null,
    }
  })
}

const ZERO_METRICS: DerivedMetrics = {
  solarEnergyKwh: 0,
  co2AvoidedKg: 0,
  batteryStatus: "Idle",
  systemOnline: false,
  currentSolarPower: 0,
  currentBatteryVoltage: 0,
}

/**
 * Like useMicrogridData, but also fetches WeatherFlow readings in parallel
 * and exposes merged ResearchReading rows. The merged shape is a strict
 * supertype of MicrogridReading, so existing charts can consume it
 * unchanged — only new cross-reference charts need the `wf_*` fields.
 */
export function useResearchData(
  initial: ResearchSelection = { range: "today" }
): UseResearchDataResult {
  const [selection, setSelection] = useState<ResearchSelection>(initial)
  const [rawData, setRawData] = useState<ResearchReading[]>([])
  const [chartData, setChartData] = useState<ResearchReading[]>([])
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null)
  const [latestWeather, setLatestWeather] = useState<WeatherReading | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (sel: ResearchSelection) => {
    setLoading(true)
    try {
      const [readings, weather] = await Promise.all([
        sel.date
          ? fetchReadingsForDate(sel.date)
          : fetchReadings(sel.range),
        sel.date
          ? fetchWeatherReadingsForDate(sel.date)
          : fetchWeatherReadings(sel.range),
      ])

      setLatestWeather(weather.length > 0 ? weather[weather.length - 1] : null)

      if (readings.length > 0) {
        const merged = mergeByMinute(readings, weather)
        setRawData(merged)
        setChartData(downsample(merged))
        setMetrics(computeMetrics(readings))
        setIsLive(true)
      } else {
        const zeros = zeroReadingsForDate(sel.date)
        setRawData(zeros)
        setChartData(zeros)
        setMetrics(ZERO_METRICS)
        setIsLive(false)
      }
    } catch {
      const zeros = zeroReadingsForDate(sel.date)
      setRawData(zeros)
      setChartData(zeros)
      setMetrics(ZERO_METRICS)
      setLatestWeather(null)
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(selection)
  }, [selection, load])

  // Auto-refresh every 60s when viewing today, no pinned date.
  useEffect(() => {
    if (selection.date) return
    if (selection.range !== "today") return
    const id = setInterval(() => load({ range: "today" }), 60_000)
    return () => clearInterval(id)
  }, [selection, load])

  const reload = useCallback(() => load(selection), [load, selection])

  return {
    selection,
    setSelection,
    rawData,
    chartData,
    metrics,
    latestWeather,
    isLive,
    loading,
    reload,
  }
}
