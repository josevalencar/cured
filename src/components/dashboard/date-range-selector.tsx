"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DateRange } from "@/lib/types"

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
  disabled?: boolean
}

export function DateRangeSelector({
  value,
  onChange,
  disabled,
}: DateRangeSelectorProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as DateRange)}
    >
      <TabsList>
        <TabsTrigger value="today" disabled={disabled}>
          Today
        </TabsTrigger>
        <TabsTrigger value="week" disabled={disabled}>
          7 Days
        </TabsTrigger>
        <TabsTrigger value="month" disabled={disabled}>
          30 Days
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
