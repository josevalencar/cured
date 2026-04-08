import type { MicrogridReading } from "./types"

/**
 * Compute the XAxis props for a given dataset.
 *
 * - For "today" data (labels like "14:30"), shows ~8 evenly spaced times.
 * - For multi-day data (labels like "Apr 3"), shows each date once,
 *   suppressing duplicates so the axis reads: Apr 1 · Apr 2 · Apr 3 ...
 */
export function xAxisProps(data: MicrogridReading[]) {
  if (data.length === 0) return { interval: 0 as number }

  // Detect if this is multi-day data by checking if any label contains a space
  // (multi-day labels are "Apr 3", today labels are "14:30")
  const isMultiDay = data[0]?.label?.includes(" ") ?? false

  if (!isMultiDay) {
    // Today view: show every Nth label for ~8 ticks
    return {
      interval: Math.max(1, Math.floor(data.length / 8)),
    }
  }

  // Multi-day view: show only the first occurrence of each date
  // Build a set of indices where the label changes
  const tickIndices = new Set<number>()
  let lastLabel = ""
  for (let i = 0; i < data.length; i++) {
    if (data[i].label !== lastLabel) {
      tickIndices.add(i)
      lastLabel = data[i].label
    }
  }

  // If too many unique dates (30-day view), thin them to ~8
  if (tickIndices.size > 10) {
    const allIndices = Array.from(tickIndices)
    const step = Math.ceil(allIndices.length / 8)
    const thinned = new Set<number>()
    for (let i = 0; i < allIndices.length; i += step) {
      thinned.add(allIndices[i])
    }
    return {
      interval: 0 as number,
      tickFormatter: (_val: string, index: number) =>
        thinned.has(index) ? data[index]?.label ?? "" : "",
    }
  }

  return {
    interval: 0 as number,
    tickFormatter: (_val: string, index: number) =>
      tickIndices.has(index) ? data[index]?.label ?? "" : "",
  }
}
