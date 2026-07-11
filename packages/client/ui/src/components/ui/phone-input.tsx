import * as React from "react"
import { PhoneIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Input } from "./input"

function PhoneInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <div data-slot="phone-input" className="relative w-full">
      <PhoneIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="tel" inputMode="tel" className={cn("pl-9", className)} {...props} />
    </div>
  )
}

export { PhoneInput }
