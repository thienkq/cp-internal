"use client";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Label } from "@workspace/ui/components/label";
import { createBrowserClient } from "@workspace/supabase";

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
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from("users").select("id, full_name, email").eq("is_active", true);
      if (!error) {
        setUsers(excludeUserId ? data.filter((u: any) => u.id !== excludeUserId) : data);
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