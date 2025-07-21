import { createServerClient } from "@workspace/supabase";
import { DataTable } from "@/components/users/tables/data-table";
import { PageContainer } from "@workspace/ui/components/page-container";

export default async function AdminUserListPage() {
  const supabase = await createServerClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Error loading users: {error.message}</div>;
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Users</h1>
      <DataTable data={users} />
    </PageContainer>
  );
}
