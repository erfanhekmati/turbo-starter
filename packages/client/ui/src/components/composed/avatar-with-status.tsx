import * as React from "react"

import { cn } from "../../lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"

type AvatarWithStatusProps = {
  name: string
  imageUrl?: string
  status?: "online" | "offline" | "away" | "busy"
  className?: string
}

function AvatarWithStatus({ name, imageUrl, status, className }: AvatarWithStatusProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <div className={cn("relative inline-flex", className)}>
      <Avatar>
        <AvatarImage src={imageUrl} alt={name} />
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      {status && (
        <span
          className={cn(
            "absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-background",
            status === "online" && "bg-success",
            status === "away" && "bg-warning",
            status === "busy" && "bg-destructive",
            status === "offline" && "bg-muted-foreground"
          )}
        />
      )}
    </div>
  )
}

export { AvatarWithStatus }
