"use client";
import { Input } from "@workspace/ui/components/input";
import { X } from "lucide-react"
import { Button } from "@workspace/ui/components/button";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import type { Table } from "@tanstack/react-table";

interface FilterOption {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  searchField?: {
    key: string;
    placeholder: string;
  };
  filters?: {
    columnKey: string;
    title: string;
    options: FilterOption[];
  }[];
}

export function DataTableToolbar<TData>({
  table,
  searchField,
  filters = [],
}: DataTableToolbarProps<TData>) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-1 items-center space-x-2 min-w-0">
        {searchField && (
          <Input
            placeholder={searchField.placeholder}
            value={(table.getColumn(searchField.key)?.getFilterValue() as string) ?? ""}
            onChange={event => table.getColumn(searchField.key)?.setFilterValue(event.target.value)}
            className="max-w-xs"
          />
        )}
        {filters.map((filter) => (
          table.getColumn(filter.columnKey) && (
            <DataTableFacetedFilter
              key={filter.columnKey}
              column={table.getColumn(filter.columnKey)}
              title={filter.title}
              options={filter.options}
            />
          )
        ))}
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
    </div>
  );
} 