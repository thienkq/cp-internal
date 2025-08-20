"use client";
import { DataTable as GenericDataTable } from "../../common/data-table";
import { columns } from "./columns";
import type { User } from "@/types";
import { genderOptions, roleOptions } from "../user-constants";

export function DataTable({ data, onUpdate }: { data: User[]; onUpdate?: () => void }) {
  return (
    <GenericDataTable 
      data={data} 
      columns={columns}
      searchField={{
        key: "email",
        placeholder: "Search email..."
      }}
      filters={[
        {
          columnKey: "gender",
          title: "Gender",
          options: genderOptions,
        },
        {
          columnKey: "role",
          title: "Role", 
          options: roleOptions,
        },
      ]}
      onUpdate={onUpdate}
    />
  );
} 