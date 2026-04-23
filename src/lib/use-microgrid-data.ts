"use client"

import { useCallback, useEffect, useState } from "react"
import { computeMetrics, fetchReadings, fetchReadingsForDate } from "./microgrid-data"
import { downsample } from "./downsample"
import type { DateRange, DerivedMetrics, MicrogridReading } from "./types"

export interface MicrogridSelection {
  range: DateRange
  date?: string | null
}

export interface UseMicrogridDataResult {
  selection: MicrogridSelection
  setSelection: (sel: MicrogridSelection) => void
  rawData: MicrogridReading[]
  chartData: MicrogridReading[]
  metrics: DerivedMetrics | null
  isLive: boolean
  loading: boolean
  reload: () => void
}

/**
 * Generate a full day of zero-value readings (one per hour, 00:00–23:00)
 * for a given ISO date string (YYYY-MM-DD) or today if omitted.
 * This keeps the x-axis readable when there is no real data.
 */
function zeroReadingsForDate(dateISO?: string | null): MicrogridReading[] {
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

export function useMicrogridData(
  initial: MicrogridSelection = { range: "today" }
): UseMicrogridDataResult {
  const [selection, setSelection] = useState<MicrogridSelection>(initial)
  const [rawData, setRawData] = useState<MicrogridReading[]>([])
  const [chartData, setChartData] = useState<MicrogridReading[]>([])
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (sel: MicrogridSelection) => {
    setLoading(true)
    try {
      const readings = sel.date
        ? await fetchReadingsForDate(sel.date)
        : await fetchReadings(sel.range)

      if (readings.length > 0) {
        setRawData(readings)
        setChartData(downsample(readings))
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
      setIsLive(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(selection)
  }, [selection, load])

  // Auto-refresh every 60s when viewing "today" with no specific date pinned
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
    isLive,
    loading,
    reload,
  }
}
