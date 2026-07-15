"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

const DEFAULT_STORAGE_KEY = "sidebar-collapsed";

type SidebarNavItem = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
};

type SidebarNavProps = {
  items: SidebarNavItem[];
  logo?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  renderLink?: (
    item: SidebarNavItem,
    children: React.ReactNode,
  ) => React.ReactNode;
  collapsible?: boolean;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  storageKey?: string | null;
};

function useSidebarCollapsed({
  collapsed: collapsedProp,
  defaultCollapsed = false,
  onCollapsedChange,
  storageKey = DEFAULT_STORAGE_KEY,
}: {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  storageKey?: string | null;
} = {}) {
  const isControlled = collapsedProp !== undefined;
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);

  React.useEffect(() => {
    if (isControlled || !storageKey) return;
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored === "true") setUncontrolled(true);
      if (stored === "false") setUncontrolled(false);
    } catch {}
  }, [isControlled, storageKey]);

  const collapsed = isControlled ? collapsedProp : uncontrolled;

  function setCollapsed(next: boolean) {
    if (!isControlled) {
      setUncontrolled(next);
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, String(next));
        } catch {}
      }
    }
    onCollapsedChange?.(next);
  }

  return [collapsed, setCollapsed] as const;
}

function SidebarCollapseToggle({
  collapsed,
  onCollapsedChange,
  className,
}: {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      aria-expanded={!collapsed}
      onClick={() => onCollapsedChange(!collapsed)}
      className={className}
    >
      {collapsed ? (
        <ChevronRightIcon className="size-4" />
      ) : (
        <ChevronLeftIcon className="size-4" />
      )}
    </Button>
  );
}

function SidebarNav({
  items,
  logo,
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
  const [collapsed, setCollapsed] = useSidebarCollapsed({
    collapsed: collapsedProp,
    defaultCollapsed,
    onCollapsedChange,
    storageKey,
  });

  const showCollapsed = collapsible && collapsed;

  return (
    <aside
      data-collapsed={showCollapsed || undefined}
      className={cn(
        "flex min-h-0 shrink-0 flex-col self-stretch overflow-hidden border-r bg-background transition-[width] duration-200 ease-in-out",
        showCollapsed ? "w-16" : "w-64",
        className,
      )}
    >
      {(logo || collapsible) && (
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b px-3",
            showCollapsed ? "justify-center" : "gap-2",
          )}
        >
          {logo && !showCollapsed && (
            <div className="min-w-0 flex-1 truncate font-semibold">{logo}</div>
          )}
          {collapsible && (
            <SidebarCollapseToggle
              collapsed={showCollapsed}
              onCollapsedChange={setCollapsed}
            />
          )}
        </div>
      )}

      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-4 overflow-hidden",
          showCollapsed ? "p-2" : "p-4",
        )}
      >
        {header && !showCollapsed ? header : null}

        <ScrollArea className="min-h-0 flex-1">
          <nav
            className={cn(
              "flex flex-col gap-1",
              showCollapsed ? "items-center" : "pr-3",
            )}
          >
            {items.map((item) => {
              const content = (
                <span
                  className={cn(
                    "flex cursor-pointer items-center rounded-md text-sm font-medium transition-colors",
                    showCollapsed ? "size-9 justify-center" : "gap-2 px-3 py-2",
                    item.active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {item.icon}
                  {!showCollapsed && item.label}
                </span>
              );

              const linked = renderLink ? (
                renderLink(item, content)
              ) : (
                <a href={item.href}>{content}</a>
              );

              if (!showCollapsed) {
                return (
                  <React.Fragment key={item.href}>{linked}</React.Fragment>
                );
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
              );
            })}
          </nav>
        </ScrollArea>

        {footer && !showCollapsed ? footer : null}
      </div>
    </aside>
  );
}

export {
  SidebarNav,
  SidebarCollapseToggle,
  useSidebarCollapsed,
  type SidebarNavItem,
};
