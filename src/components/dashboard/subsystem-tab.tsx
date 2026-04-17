"use client"

import type { ReactNode } from "react"

interface Stat {
  label: string
  value: string
  unit?: string
}

interface SubsystemTabProps {
  eyebrow: string
  title: string
  intro: string
  accent: string
  stats: Stat[]
  note?: string
  chart: ReactNode
}

export function SubsystemTab({
  eyebrow,
  title,
  intro,
  accent,
  stats,
  note,
  chart,
}: SubsystemTabProps) {
  return (
    <div
      className="rise-in relative overflow-hidden border border-rule/15 bg-card shadow-[0_1px_0_0_rgba(20,20,20,0.04)]"
      style={{ animationDelay: "60ms" }}
    >
      <div
        aria-hidden
        className="h-[3px] w-full"
        style={{ backgroundColor: accent }}
      />
      <div className="px-5 pt-6 pb-4 sm:px-8 sm:pt-8">
        <p
          className="small-caps text-[10px] sm:text-[11px]"
          style={{ color: accent }}
        >
          {eyebrow}
        </p>
        <h3 className="font-serif-display mt-2 text-3xl sm:text-5xl">
          {title}
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {intro}
        </p>
      </div>

      <div className="px-2 pb-2 sm:px-6 sm:pb-4">{chart}</div>

      <div className="double-rule mx-5 sm:mx-8" />

      <dl className="grid grid-cols-3 gap-4 px-5 py-5 sm:px-8 sm:py-6">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <dt className="small-caps text-[10px] text-muted-foreground">
              {s.label}
            </dt>
            <dd className="font-serif-display mt-1 text-2xl sm:text-3xl">
              {s.value}
              {s.unit && (
                <span className="ml-1 font-mono text-[11px] text-muted-foreground sm:text-xs">
                  {s.unit}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {note && (
        <p className="border-t border-rule/10 bg-muted/40 px-5 py-3 font-mono text-[11px] leading-relaxed text-muted-foreground sm:px-8">
          <span className="small-caps mr-2 text-foreground/70">note</span>
          {note}
        </p>
      )}
    </div>
  )
}
