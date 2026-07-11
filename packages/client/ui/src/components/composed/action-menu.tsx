"use client"

import * as React from "react"
import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type MenuAction = {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  variant?: "default" | "destructive"
  disabled?: boolean
  separatorBefore?: boolean
}

type ActionMenuProps = {
  actions: MenuAction[]
  trigger?: React.ReactNode
  align?: "start" | "center" | "end"
}

function ActionMenu({ actions, trigger, align = "end" }: ActionMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="icon">
            <MoreHorizontalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-48">
        {actions.map((action) => (
          <React.Fragment key={action.label}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={action.variant}
              disabled={action.disabled}
              onSelect={action.onSelect}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ActionMenu, type MenuAction }
