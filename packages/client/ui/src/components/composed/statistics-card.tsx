import * as React from "react"
import { TrendingDownIcon, TrendingUpIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"

type StatisticsCardProps = {
  label: string
  value: string | number
  change?: number
  icon?: React.ReactNode
  className?: string
}

function StatisticsCard({ label, value, change, icon, className }: StatisticsCardProps) {
  const isPositive = (change ?? 0) >= 0

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <CardDescription>{label}</CardDescription>
        </div>
        <CardTitle className="text-2xl font-semibold tabular-nums">{value}</CardTitle>
        {change !== undefined && (
          <CardAction>
            <Badge
              variant="outline"
              className={cn(isPositive ? "text-success" : "text-destructive")}
            >
              {isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
              {isPositive ? "+" : ""}
              {change}%
            </Badge>
          </CardAction>
        )}
      </CardHeader>
    </Card>
  )
}

export { StatisticsCard }
