import * as React from "react"

import { cn } from "../../lib/utils"
import { Input } from "./input"

function CurrencyInput({
  className,
  currencySymbol = "$",
  ...props
}: React.ComponentProps<"input"> & { currencySymbol?: string }) {
  return (
    <div data-slot="currency-input" className="relative w-full">
      <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
        {currencySymbol}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        className={cn("pl-7", className)}
        {...props}
      />
    </div>
  )
}

export { CurrencyInput }
