"use client"

import * as React from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip"

const DEFAULT_STORAGE_KEY = "sidebar-collapsed"

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
  /** Enable collapse to an icons-only rail. Defaults to true. */
  collapsible?: boolean
  /** Controlled collapsed state. */
  collapsed?: boolean
  /** Uncontrolled initial collapsed state. */
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  /** Persist collapsed state in localStorage. Pass `null` to disable. */
  storageKey?: string | null
}

function useCollapsedState({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  storageKey,
}: {
  collapsed?: boolean
  defaultCollapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
  storageKey: string | null
}) {
  const isControlled = collapsedProp !== undefined
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed)

  React.useEffect(() => {
    if (isControlled || !storageKey) return
    try {
      const stored = window.localStorage.getItem(storageKey)
      if (stored === "true") setUncontrolled(true)
      if (stored === "false") setUncontrolled(false)
    } catch {
      // ignore storage errors
    }
  }, [isControlled, storageKey])

  const collapsed = isControlled ? collapsedProp : uncontrolled

  function setCollapsed(next: boolean) {
    if (!isControlled) {
      setUncontrolled(next)
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, String(next))
        } catch {
          // ignore storage errors
        }
      }
    }
    onCollapsedChange?.(next)
  }

  return [collapsed, setCollapsed] as const
}

function SidebarNav({
  items,
  header,
  footer,
  className,
  renderLink,
  collapsible = true,
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  storageKey = DEFAULT_STORAGE_KEY,
}: SidebarNavProps) {
  const [collapsed, setCollapsed] = useCollapsedState({
    collapsed: collapsedProp,
    defaultCollapsed,
    onCollapsedChange,
    storageKey,
  })

  const showCollapsed = collapsible && collapsed

  return (
    <aside
      data-collapsed={showCollapsed || undefined}
      className={cn(
        "relative flex min-h-0 shrink-0 flex-col gap-4 self-stretch border-r bg-background transition-[width,padding] duration-200 ease-in-out",
        showCollapsed ? "w-16 p-2" : "w-64 p-4",
        className
      )}
    >
      {header && !showCollapsed ? header : null}

      <ScrollArea className="min-h-0 flex-1 overflow-hidden">
        <nav
          className={cn(
            "flex flex-col gap-1",
            showCollapsed ? "items-center" : "pr-3"
          )}
        >
          {items.map((item) => {
            const content = (
              <span
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  showCollapsed
                    ? "size-9 justify-center"
                    : "gap-2 px-3 py-2",
                  item.active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                {item.icon}
                {!showCollapsed && item.label}
              </span>
            )

            const linked = renderLink ? (
              renderLink(item, content)
            ) : (
              <a href={item.href}>{content}</a>
            )

            if (!showCollapsed) {
              return (
                <React.Fragment key={item.href}>{linked}</React.Fragment>
              )
            }

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <span className="inline-flex">{linked}</span>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </ScrollArea>

      {footer && !showCollapsed ? footer : null}

      {collapsible && (
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          aria-label={showCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!showCollapsed}
          onClick={() => setCollapsed(!showCollapsed)}
          className="absolute top-1/2 -right-3 z-20 size-6 -translate-y-1/2 rounded-full border bg-background shadow-sm hover:bg-accent"
        >
          {showCollapsed ? (
            <ChevronRightIcon className="size-3.5" />
          ) : (
            <ChevronLeftIcon className="size-3.5" />
          )}
        </Button>
      )}
    </aside>
  )
}

export { SidebarNav, type SidebarNavItem }
