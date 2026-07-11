"use client";

import { type ColumnDef } from "@tanstack/react-table";
import { Badge, TableActionsMenu } from "@repo/ui";

export type Invoice = {
  id: string;
  customer: string;
  amount: number;
  status: "paid" | "pending" | "failed";
};

export const invoiceColumns: ColumnDef<Invoice>[] = [
  { accessorKey: "id", header: "Invoice" },
  { accessorKey: "customer", header: "Customer" },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const variant =
        status === "paid" ? "success" : status === "pending" ? "pending" : "destructive";
      return <Badge variant={variant}>{status}</Badge>;
    },
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <TableActionsMenu
        actions={[
          { label: "View", onSelect: () => console.log("view", row.original.id) },
          { label: "Edit", onSelect: () => console.log("edit", row.original.id) },
          {
            label: "Delete",
            variant: "destructive",
            separatorBefore: true,
            onSelect: () => console.log("delete", row.original.id),
          },
        ]}
      />
    ),
  },
];

export const invoiceData: Invoice[] = Array.from({ length: 24 }).map((_, i) => ({
  id: `INV-${1000 + i}`,
  customer: ["Alice Smith", "Bob Chen", "Carla Diaz", "Dev Patel"][i % 4]!,
  amount: 50 + i * 12.5,
  status: (["paid", "pending", "failed"] as const)[i % 3]!,
}));
