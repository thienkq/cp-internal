"use client";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react"
import { Button } from "@workspace/ui/components/button";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import type { Table } from "@tanstack/react-table";
import { DataTableViewOptions } from "./data-table-view-options";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  genderOptions: { label: string; value: string }[];
  roleOptions: { label: string; value: string }[];
}

export function DataTableToolbar<TData>({
  table,
  genderOptions,
  roleOptions,
}: DataTableToolbarProps<TData>) {
  return (
      <div className="flex items-center justify-between w-full">
          <div className="flex flex-1 items-center space-x-2 min-w-0">
          <Input
                placeholder="Search email..."
                value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                onChange={event => table.getColumn("email")?.setFilterValue(event.target.value)}
                className="max-w-xs"
            />
            {table.getColumn("gender") && (<DataTableFacetedFilter
                column={table.getColumn("gender")}
                title="Gender"
                options={genderOptions}
              />)}
            {table.getColumn("role") && (<DataTableFacetedFilter
                column={table.getColumn("role")}
                title="Role"
                options={roleOptions}
            />)}
            <Button
                type="button"
                variant="outline"
                className="px-3 py-1 text-sm"
                onClick={() => {
                table.resetColumnFilters();
                table.resetSorting();
                }}
            >
                Reset
                <X className="w-4 h-4" />
            </Button>
          </div>
      <div>
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
} 