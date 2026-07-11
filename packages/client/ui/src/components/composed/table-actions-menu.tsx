"use client"

import * as React from "react"
import { MoreHorizontalIcon } from "lucide-react"

import { Button } from "../ui/button"
import { ActionMenu, type MenuAction } from "./action-menu"

type TableActionsMenuProps = {
  actions: MenuAction[]
}

function TableActionsMenu({ actions }: TableActionsMenuProps) {
  return (
    <ActionMenu
      actions={actions}
      trigger={
        <Button variant="ghost" size="icon-sm">
          <MoreHorizontalIcon />
          <span className="sr-only">Row actions</span>
        </Button>
      }
    />
  )
}

export { TableActionsMenu }
