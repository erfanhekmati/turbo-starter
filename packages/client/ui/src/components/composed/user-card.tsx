import * as React from "react"

import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"

type UserCardProps = {
  name: string
  role?: string
  email?: string
  avatarUrl?: string
  status?: "online" | "offline" | "away"
  actions?: React.ReactNode
  className?: string
}

function UserCard({
  name,
  role,
  email,
  avatarUrl,
  status,
  actions,
  className,
}: UserCardProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <Card className={cn(className)}>
      <CardContent className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="size-12">
            <AvatarImage src={avatarUrl} alt={name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {status && (
            <span
              className={cn(
                "absolute right-0 bottom-0 size-3 rounded-full border-2 border-card",
                status === "online" && "bg-success",
                status === "away" && "bg-warning",
                status === "offline" && "bg-muted-foreground"
              )}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          {role && (
            <Badge variant="secondary" className="mt-0.5">
              {role}
            </Badge>
          )}
          {email && <p className="mt-1 truncate text-sm text-muted-foreground">{email}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </CardContent>
    </Card>
  )
}

export { UserCard }
