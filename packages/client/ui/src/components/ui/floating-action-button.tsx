import * as React from "react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

function FloatingActionButton({
  className,
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="floating-action-button"
      size="icon-lg"
      className={cn(
        "fixed right-6 bottom-6 z-50 size-14 rounded-full shadow-lg hover:shadow-xl",
        className
      )}
      {...props}
    />
  )
}

export { FloatingActionButton }
