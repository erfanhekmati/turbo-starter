import * as React from "react"

import { cn } from "../../lib/utils"
import { Card, CardContent, CardFooter } from "../ui/card"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"

type ProductCardProps = {
  imageUrl: string
  imageAlt: string
  name: string
  description?: string
  price: string
  badge?: string
  onAddToCart?: () => void
  className?: string
}

function ProductCard({
  imageUrl,
  imageAlt,
  name,
  description,
  price,
  badge,
  onAddToCart,
  className,
}: ProductCardProps) {
  return (
    <Card className={cn("gap-3 overflow-hidden py-0", className)}>
      <div className="relative aspect-square w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={imageAlt} className="size-full object-cover" />
        {badge && <Badge className="absolute top-3 left-3">{badge}</Badge>}
      </div>
      <CardContent className="space-y-1 pt-3">
        <p className="font-medium">{name}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardContent>
      <CardFooter className="flex items-center justify-between pb-6">
        <span className="text-lg font-semibold">{price}</span>
        {onAddToCart && (
          <Button size="sm" onClick={onAddToCart}>
            Add to cart
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

export { ProductCard }
