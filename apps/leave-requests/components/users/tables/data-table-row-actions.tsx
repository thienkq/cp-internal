"use client";
import { useState } from "react";
import { Row } from "@tanstack/react-table";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { MoreHorizontal, UserCog } from "lucide-react";
import type { User } from "@/types";
import { RoleUpdateDialog } from "../role-update-dialog";

interface DataTableRowActionsProps {
  row: Row<User>;
  onUpdate?: () => void;
}

export function DataTableRowActions({ row, onUpdate }: DataTableRowActionsProps) {
  const user = row.original;
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const handleRoleUpdate = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
  
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsRoleDialogOpen(true)}>
            Update Role
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={`/admin/users/${user.id}`}>Edit Profile</a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RoleUpdateDialog
        user={user}
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        onSuccess={handleRoleUpdate}
      />
    </>
  );
} 