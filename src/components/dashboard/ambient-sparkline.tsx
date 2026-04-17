"use client"

import { useId } from "react"
import { Area, AreaChart, Line, LineChart, ResponsiveContainer } from "recharts"
import type { MicrogridReading } from "@/lib/types"

interface SparklineProps {
  data: MicrogridReading[]
  dataKey: keyof MicrogridReading
  color: string
  variant?: "area" | "line"
  height?: number
}

export function AmbientSparkline({
  data,
  dataKey,
  color,
  variant = "area",
  height = 120,
}: SparklineProps) {
  const uid = useId()
  if (!data || data.length === 0) {
    return <div style={{ height }} aria-hidden />
  }

  const id = `spark-${String(dataKey)}-${uid.replace(/:/g, "")}`

  return (
    <div style={{ width: "100%", height }} aria-hidden>
      <ResponsiveContainer width="100%" height="100%">
        {variant === "area" ? (
          <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2.2}
              fill={`url(#${id})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <Line
              type="monotone"
              dataKey={dataKey as string}
              stroke={color}
              strokeWidth={2.2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
