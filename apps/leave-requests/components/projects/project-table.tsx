"use client";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../common/data-table";
import { Button } from "@workspace/ui/components/button";
import { Badge } from "@workspace/ui/components/badge";
import { Switch } from "@workspace/ui/components/switch";

type Project = {
  id: string;
  name: string;
  is_billable: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

interface ProjectTableProps {
  data: Project[];
  onEdit: (project: Project) => void;
  onToggleActive: (project: Project, value: boolean) => void;
}

export default function ProjectTable({ data, onEdit, onToggleActive }: ProjectTableProps) {
  const columns: ColumnDef<Project>[] = [
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Billable",
      accessorKey: "is_billable",
      cell: ({ row }) => (
        row.original.is_billable ? <Badge variant="default">Billable</Badge> : <Badge variant="secondary">Non-billable</Badge>
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = row.getValue(columnId) as boolean;
        return filterValue.some((value: string) => {
          const boolValue = value === "true";
          return cellValue === boolValue;
        });
      },
    },
    {
      header: "Active",
      accessorKey: "is_active",
      cell: ({ row }) => (
        <Switch checked={row.original.is_active} onCheckedChange={val => onToggleActive(row.original, val)} />
      ),
      filterFn: (row, columnId, filterValue) => {
        if (!filterValue || filterValue.length === 0) return true;
        const cellValue = row.getValue(columnId) as boolean;
        return filterValue.some((value: string) => {
          const boolValue = value === "true";
          return cellValue === boolValue;
        });
      },
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" onClick={() => onEdit(row.original)}>Edit</Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const billableOptions = [
    { label: "Billable", value: "true" },
    { label: "Non-billable", value: "false" },
  ];

  const activeOptions = [
    { label: "Active", value: "true" },
    { label: "Inactive", value: "false" },
  ];

  return (
    <DataTable 
      data={data} 
      columns={columns}
      searchField={{
        key: "name",
        placeholder: "Search projects..."
      }}
      filters={[
        {
          columnKey: "is_billable",
          title: "Billable",
          options: billableOptions,
        },
        {
          columnKey: "is_active", 
          title: "Status",
          options: activeOptions,
        },
      ]}
    />
  );
} 