"use client";
import { DataTable as GenericDataTable } from "../../common/data-table";
import { columns } from "./columns";
import type { User } from "@/types";

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
];

const roleOptions = [
  { label: "Employee", value: "employee" },
  { label: "Manager", value: "manager" },
  { label: "Admin", value: "admin" },
];

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