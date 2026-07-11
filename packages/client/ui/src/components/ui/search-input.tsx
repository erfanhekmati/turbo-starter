import * as React from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Input } from "./input"

function SearchInput({
  className,
  onClear,
  value,
  ...props
}: React.ComponentProps<"input"> & { onClear?: () => void }) {
  return (
    <div data-slot="search-input" className="relative w-full">
      <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        className={cn("pl-9", onClear && value ? "pr-9" : undefined, className)}
        {...props}
      />
      {onClear && value ? (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear search"
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <XIcon className="size-4" />
        </button>
      ) : null}
    </div>
  )
}

export { SearchInput }
