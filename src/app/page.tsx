"use client"

import { useMicrogridData } from "@/lib/use-microgrid-data"
import { AmbientView } from "@/components/dashboard/ambient-view"
import { LearnSection } from "@/components/dashboard/research-view"
import type { DateRange } from "@/lib/types"

export default function LandingPage() {
  const {
    selection,
    setSelection,
    rawData,
    chartData,
    metrics,
    isLive,
    loading,
  } = useMicrogridData({ range: "today" })

  if (!metrics) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white text-muted-foreground">
        <p className="small-caps font-mono text-xs">loading microgrid data…</p>
      </div>
    )
  }

  return (
    <>
      <AmbientView metrics={metrics} readings={rawData} isLive={isLive} />
      <LearnSection
        chartData={chartData}
        rawData={rawData}
        metrics={metrics}
        range={selection.range}
        onRangeChange={(r: DateRange) => setSelection({ range: r })}
        isLive={isLive}
        loading={loading}
      />
    </>
  )
}
