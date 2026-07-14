import * as React from "react"

import { cn } from "../../lib/utils"

type NavbarProps = {
  /** Optional logo — omit when branding lives in the sidebar. */
  logo?: React.ReactNode
  /** Content rendered before the logo. */
  start?: React.ReactNode
  /** Secondary content after the logo (e.g. breadcrumbs). */
  links?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function Navbar({ logo, start, links, actions, className }: NavbarProps) {
  const hasLeading = Boolean(start || logo)

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 w-full items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {hasLeading && (
          <div className="flex shrink-0 items-center gap-2">
            {start}
            {logo && <div className="font-semibold">{logo}</div>}
          </div>
        )}
        {links && <div className="min-w-0 truncate">{links}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}

export { Navbar }
