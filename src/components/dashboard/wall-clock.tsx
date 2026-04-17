"use client"

import { useEffect, useState } from "react"

export function WallClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    const raf = requestAnimationFrame(() => setNow(new Date()))
    return () => {
      clearInterval(id)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (!now) {
    return (
      <span className="font-mono text-[clamp(0.875rem,2vw,1.125rem)] text-white/60">
        --:--:--
      </span>
    )
  }

  const hours = now.getHours()
  const mm = String(now.getMinutes()).padStart(2, "0")
  const ss = String(now.getSeconds()).padStart(2, "0")
  const ampm = hours >= 12 ? "PM" : "AM"
  const hh = String(hours % 12 || 12).padStart(2, "0")
  const tz = now
    .toLocaleTimeString("en-US", { timeZoneName: "short" })
    .split(" ")
    .pop()

  return (
    <span className="font-mono text-[clamp(0.875rem,2vw,1.125rem)] tracking-tight text-white/75">
      {hh}:{mm}:<span className="text-white/40">{ss}</span>
      <span className="ml-1 text-[10px] text-white/40">{ampm}</span>
      {tz && <span className="ml-1 text-[10px] text-white/40">{tz}</span>}
    </span>
  )
}
