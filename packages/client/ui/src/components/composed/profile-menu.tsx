"use client"

import * as React from "react"
import { LogOutIcon, SettingsIcon, UserIcon } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
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
  role?: string
  avatarUrl?: string
  items?: ProfileMenuItem[]
  onProfile?: () => void
  onSettings?: () => void
  onLogout?: () => void
}

function ProfileMenu({
  name,
  email,
  role,
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

  const hasMenuItems = Boolean(onProfile || onSettings || items?.length)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
        <Avatar>
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-1.5">
          <span className="font-medium">{name}</span>
          {email && <span className="text-xs font-normal text-muted-foreground">{email}</span>}
          {role && (
            <Badge variant="secondary" className="w-fit font-normal">
              {role}
            </Badge>
          )}
        </DropdownMenuLabel>
        {hasMenuItems && (
          <>
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
          </>
        )}
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
