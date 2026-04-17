"use client"

import Image from "next/image"

interface EditorialMastheadProps {
  isLive: boolean
  dateLabel: string
  readingCount?: number
}

export function EditorialMasthead({
  isLive,
  dateLabel,
  readingCount,
}: EditorialMastheadProps) {
  return (
    <header className="border-b border-rule bg-clark-red text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Image
            src="/clark.png"
            alt="Clark University"
            width={28}
            height={28}
            className="rounded-full ring-1 ring-white/30"
          />
          <div className="leading-tight">
            <p className="font-serif-display text-lg tracking-tight">
              CURED
            </p>
            <p className="small-caps text-[10px] text-white/70">
              Clark University Renewable Energy Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[10px] text-white/75 sm:text-[11px]">
          <span className="small-caps hidden sm:inline">PHYS 243 / 343</span>
          <span className="small-caps">{dateLabel}</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className={`inline-block h-1.5 w-1.5 rounded-full ${
                isLive ? "bg-emerald-300 live-dot" : "bg-amber-300"
              }`}
            />
            <span className="small-caps">{isLive ? "live" : "mock"}</span>
          </span>
        </div>
      </div>
      {typeof readingCount === "number" && (
        <div className="border-t border-white/10 bg-clark-red/95">
          <div className="mx-auto max-w-6xl px-4 py-1 text-[10px] tracking-widest text-white/70 sm:px-6 lg:px-8">
            <span className="small-caps">
              Vol. 1 · Edition {dateLabel.replace(/[^0-9]/g, "").slice(-4) || "0001"} · {readingCount.toLocaleString()} readings on record
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
