import * as React from "react"

import { cn } from "../../lib/utils"

type SidebarNavItem = {
  label: string
  href: string
  icon?: React.ReactNode
  active?: boolean
}

type SidebarNavProps = {
  items: SidebarNavItem[]
  header?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  renderLink?: (item: SidebarNavItem, children: React.ReactNode) => React.ReactNode
}

function SidebarNav({ items, header, footer, className, renderLink }: SidebarNavProps) {
  return (
    <aside
      className={cn(
        "flex w-64 shrink-0 flex-col gap-4 self-stretch border-r bg-background p-4",
        className
      )}
    >
      {header}
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const content = (
            <span
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                item.active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </span>
          )
          return (
            <React.Fragment key={item.href}>
              {renderLink ? (
                renderLink(item, content)
              ) : (
                <a href={item.href}>{content}</a>
              )}
            </React.Fragment>
          )
        })}
      </nav>
      {footer}
    </aside>
  )
}

export { SidebarNav, type SidebarNavItem }
