import * as React from "react"

import { cn } from "../../lib/utils"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../ui/breadcrumb"

type AppBreadcrumbItem = {
  label: string
  href?: string
}

type AppBreadcrumbsProps = {
  items: AppBreadcrumbItem[]
  className?: string
  renderLink?: (
    item: AppBreadcrumbItem & { href: string },
    children: React.ReactNode
  ) => React.ReactNode
}

function AppBreadcrumbs({ items, className, renderLink }: AppBreadcrumbsProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1

          return (
            <React.Fragment key={`${item.label}-${item.href ?? index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !item.href ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : renderLink ? (
                  <BreadcrumbLink asChild>
                    {renderLink({ ...item, href: item.href }, item.label)}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export { AppBreadcrumbs, type AppBreadcrumbItem }
