"use client"

import * as React from "react"
import { SettingsIcon } from "lucide-react"

import { Button } from "../ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type SettingsToggle = {
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

type SettingsMenuProps = {
  toggles: SettingsToggle[]
  label?: string
}

function SettingsMenu({ toggles, label = "Settings" }: SettingsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon />
          <span className="sr-only">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {toggles.map((toggle) => (
          <DropdownMenuCheckboxItem
            key={toggle.label}
            checked={toggle.checked}
            onCheckedChange={toggle.onCheckedChange}
            onSelect={(e) => e.preventDefault()}
          >
            {toggle.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { SettingsMenu }
