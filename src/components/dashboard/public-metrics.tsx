"use client"

import { MetricCard } from "./metric-card"
import type { DerivedMetrics } from "@/lib/types"

interface PublicMetricsProps {
  metrics: DerivedMetrics
}

export function PublicMetrics({ metrics }: PublicMetricsProps) {
  return (
    <section aria-label="Summary metrics">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Solar Energy Today"
          value={metrics.solarEnergyKwh.toFixed(2)}
          unit="kWh"
          description="Derived: Σ PVpow × (1/60) / 1000"
          icon={<SunIcon />}
        />
        <MetricCard
          title="Wind Turbines"
          value={Math.max(metrics.currentHAWT, metrics.currentVAWT).toFixed(2)}
          unit="V RMS"
          description={`HAWT ${metrics.currentHAWT.toFixed(2)} V · VAWT ${metrics.currentVAWT.toFixed(2)} V`}
          icon={<WindIcon />}
        />
        <MetricCard
          title="CO₂ Avoided Today"
          value={metrics.co2AvoidedKg.toFixed(2)}
          unit="kg"
          description="Estimate: kWh × 0.386 (EPA eGRID)"
          badge={{ label: "Estimate", variant: "outline" }}
          icon={<LeafIcon />}
        />
        <MetricCard
          title="Battery"
          value={metrics.currentBatteryVoltage.toFixed(1)}
          unit="V"
          description={`Battery ${metrics.batteryStatus.toLowerCase()}`}
          icon={<BatteryIcon />}
        />
      </div>
    </section>
  )
}

export function SystemStatusIndicator({
  metrics,
}: {
  metrics: DerivedMetrics
}) {
  return (
    <span className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted-foreground">
        <ActivityIcon />
      </span>
      <span className="font-medium">
        {metrics.systemOnline ? "Online" : "Offline"}
      </span>
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          metrics.systemOnline
            ? "bg-clark-red text-white"
            : "bg-red-100 text-red-800"
        }`}
      >
        {metrics.systemOnline ? "Running" : "Down"}
      </span>
    </span>
  )
}

function SunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

function LeafIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </svg>
  )
}

function WindIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  )
}

function BatteryIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="7" width="16" height="10" rx="2" />
      <line x1="22" y1="11" x2="22" y2="13" />
      <line x1="6" y1="11" x2="6" y2="13" />
      <line x1="10" y1="11" x2="10" y2="13" />
      <line x1="14" y1="11" x2="14" y2="13" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
    </svg>
  )
}
