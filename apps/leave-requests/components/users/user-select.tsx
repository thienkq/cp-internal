"use client";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { getActiveUsers } from "@/app/actions/users";

export type UserSelectProps = {
  value: string | null | undefined;
  onChange: (value: string) => void;
  excludeUserId?: string | null;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
};

export function UserSelect({ value, onChange, excludeUserId, label, placeholder = "Select user", disabled }: UserSelectProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getActiveUsers();
        setUsers(excludeUserId ? data.filter((u: any) => u.id !== excludeUserId) : data);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
      setLoading(false);
    }
    fetchUsers();
  }, [excludeUserId]);

  return (
    <div>
      {label && <Label className="block mb-1 text-sm font-medium">{label}</Label>}
      <Select value={value || undefined} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="loading" disabled>
              Loading users...
            </SelectItem>
          ) : (
            users.map((user: any) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  );
} 