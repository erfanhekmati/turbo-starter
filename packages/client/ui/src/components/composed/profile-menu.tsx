"use client"

import * as React from "react"
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"

type ProfileMenuItem = {
  label: string
  icon?: React.ReactNode
  onSelect: () => void
  variant?: "default" | "destructive"
}

type ProfileMenuProps = {
  name: string
  email?: string
  avatarUrl?: string
  items?: ProfileMenuItem[]
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

function ProfileMenu({
  name,
  email,
  avatarUrl,
  items,
  onProfile,
  onSettings,
  onLogout,
}: ProfileMenuProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="font-medium">{name}</span>
          {email && <span className="text-xs font-normal text-muted-foreground">{email}</span>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {onProfile && (
            <DropdownMenuItem onSelect={onProfile}>
              <UserIcon /> Profile
            </DropdownMenuItem>
          )}
          {onSettings && (
            <DropdownMenuItem onSelect={onSettings}>
              <SettingsIcon /> Settings
            </DropdownMenuItem>
          )}
          {items?.map((item) => (
            <DropdownMenuItem
              key={item.label}
              variant={item.variant}
              onSelect={item.onSelect}
            >
              {item.icon}
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        {onLogout && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onLogout}>
              <LogOutIcon /> Log out
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ProfileMenu }
