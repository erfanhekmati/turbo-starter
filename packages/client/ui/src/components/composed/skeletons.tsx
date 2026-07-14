import * as React from "react"

import { Card, CardContent, CardHeader } from "../ui/card"
import { Skeleton } from "../ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table"

function ProfileMenuSkeleton() {
  return (
    <div className="flex items-center gap-2 px-2 py-1" aria-hidden>
      <Skeleton className="size-8 rounded-full" />
      <Skeleton className="hidden h-4 w-24 sm:block" />
    </div>
  )
}

function PageHeaderSkeleton({
  description = true,
}: {
  description?: boolean
}) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      {description ? <Skeleton className="h-4 w-80 max-w-full" /> : null}
    </div>
  )
}

function StatisticsCardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-8 w-16" />
      </CardHeader>
    </Card>
  )
}

function UserCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columns }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-full max-w-24" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <TableCell key={colIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function DataTableSkeleton({
  rows = 8,
  columns = 5,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading table">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Skeleton className="h-9 w-full max-w-sm" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <TableSkeleton rows={rows} columns={columns} />
      <div className="flex items-center justify-end gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  )
}

function DashboardSkeleton({
  stats = 4,
}: {
  stats?: number
}) {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: stats }).map((_, i) => (
          <StatisticsCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-md border p-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SettingsCardSkeleton() {
  return (
    <Card className="max-w-3xl" aria-busy="true" aria-label="Loading settings">
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-9 w-48" />
      </CardContent>
    </Card>
  )
}

export {
  ProfileMenuSkeleton,
  PageHeaderSkeleton,
  StatisticsCardSkeleton,
  UserCardSkeleton,
  TableSkeleton,
  DataTableSkeleton,
  DashboardSkeleton,
  SettingsCardSkeleton,
}
