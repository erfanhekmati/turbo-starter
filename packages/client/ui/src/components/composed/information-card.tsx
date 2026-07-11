import * as React from "react"

import { cn } from "../../lib/utils"
import { Card, CardContent } from "../ui/card"

type InformationCardProps = {
  icon?: React.ReactNode
  title: string
  description: string
  className?: string
}

function InformationCard({ icon, title, description, className }: InformationCardProps) {
  return (
    <Card className={cn(className)}>
      <CardContent className="flex gap-3">
        {icon && (
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            {icon}
          </span>
        )}
        <div>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export { InformationCard }
