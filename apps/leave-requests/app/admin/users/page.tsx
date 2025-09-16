"use client";
import { useState, useEffect } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { DataTable } from "@/components/users/tables/data-table";
import { PageContainer } from "@workspace/ui/components/page-container";
import type { User } from "@/types";

export default function AdminUserListPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        setError(error.message);
        return;
      }

      setUsers(data || []);
      setError(null);
    } catch (err) {
      setError("Failed to load users");
      console.error("Error loading users:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold mb-4">Users</h1>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <div className="text-destructive">Error loading users: {error}</div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <DataTable data={users} onUpdate={fetchUsers} />
    </PageContainer>
  );
}
