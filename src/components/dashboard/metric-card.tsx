"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface MetricCardProps {
  title: string
  value: string
  unit?: string
  description?: string
  badge?: {
    label: string
    variant?: "default" | "secondary" | "destructive" | "outline"
  }
  icon?: React.ReactNode
}

export function MetricCard({
  title,
  value,
  unit,
  description,
  badge,
  icon,
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between">
          <span>{title}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </CardDescription>
        <CardTitle className="flex items-baseline gap-1.5 text-2xl tabular-nums">
          {value}
          {unit && (
            <span className="text-sm font-normal text-muted-foreground">
              {unit}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant ?? "secondary"}>{badge.label}</Badge>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
