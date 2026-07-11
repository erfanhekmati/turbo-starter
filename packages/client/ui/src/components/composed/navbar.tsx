import * as React from "react"

import { cn } from "../../lib/utils"

type NavbarProps = {
  logo: React.ReactNode
  links?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

function Navbar({ logo, links, actions, className }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 w-full items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex flex-1 items-center gap-6">
        <div className="font-semibold">{logo}</div>
        {links && <nav className="hidden items-center gap-4 text-sm md:flex">{links}</nav>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  )
}

export { Navbar }
