import { requireAuth } from "@/lib/auth-server-utils";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { desc } from "drizzle-orm";
import { DataTable } from "@/components/users/tables/data-table";
import { PageContainer } from "@workspace/ui/components/page-container";
import type { User } from "@/types";

export default async function AdminUserListPage() {
  // Require authentication
  await requireAuth();

  // Fetch users using Drizzle
  const db = getDb();
  let usersData: typeof users.$inferSelect[] = [];
  let error: string | null = null;

  try {
    usersData = await db
      .select()
      .from(users)
      .orderBy(desc(users.created_at));
  } catch (err) {
    error = "Failed to load users";
    console.error("Error loading users:", err);
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
      <DataTable data={usersData as User[]} />
    </PageContainer>
  );
}
