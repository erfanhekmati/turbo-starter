import * as React from "react"
import { CheckIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card"

type PricingCardProps = {
  name: string
  price: string
  period?: string
  description?: string
  features: string[]
  ctaLabel?: string
  onCtaClick?: () => void
  highlighted?: boolean
  badge?: string
  className?: string
}

function PricingCard({
  name,
  price,
  period = "/mo",
  description,
  features,
  ctaLabel = "Get started",
  onCtaClick,
  highlighted = false,
  badge,
  className,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative",
        highlighted && "border-primary shadow-md",
        className
      )}
    >
      {badge && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">{badge}</Badge>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-3xl font-semibold">{price}</span>
          <span className="text-sm text-muted-foreground">{period}</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <CheckIcon className="size-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          variant={highlighted ? "default" : "outline"}
          onClick={onCtaClick}
        >
          {ctaLabel}
        </Button>
      </CardFooter>
    </Card>
  )
}

export { PricingCard }
