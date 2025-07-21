"use client";
import { DataTable as GenericDataTable } from "../../common/data-table";
import { columns } from "./columns";
import type { User } from "@/types";
import { genderOptions, roleOptions } from "../user-constants";

export function DataTable({ data }: { data: User[] }) {
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
    />
  );
} 