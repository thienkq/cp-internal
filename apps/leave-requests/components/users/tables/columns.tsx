"use client";
import { ColumnDef } from "@tanstack/react-table";
import type { User } from "@/types";
import { DataTableColumnHeader } from "./data-table-column-header";
import { DataTableRowActions } from "./data-table-row-actions";
import { Badge } from "@workspace/ui/components/badge";

const roleColors: Record<string, "default" | "secondary" | "destructive"> = {
  employee: "default",
  manager: "secondary",
  admin: "destructive",
};
const genderColors: Record<string, "default" | "secondary"> = {
  male: "default",
  female: "secondary"
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    enableSorting: true,
  },
  {
    accessorKey: "full_name",
    header: "Name",
  },
  {
    accessorKey: "role",
    header: "Role",
    filterFn: "equals",
    enableSorting: false,
    cell: ({ row }) => (
      <Badge variant={roleColors[row.original.role] || "default"}>
        {row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1)}
      </Badge>
    ),
  },
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "gender",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Gender" />,
    filterFn: "equals",
    cell: ({ row }) => {
      const gender = (row.original.gender || "").toLowerCase();
      if (!gender) return null;
      return (
        <Badge variant={genderColors[gender] || "default"}>
          {gender.charAt(0).toUpperCase() + gender.slice(1)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: "Start Date",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <DataTableRowActions row={row} />,
    enableSorting: false,
    enableHiding: false,
  },
]; 