import { PageContainer } from "@workspace/ui/components/page-container";
import { createServerClient } from "@workspace/supabase";
import MyAssignmentList from "@/components/projects/my-assignment-list";

export default async function MyAssignmentsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <PageContainer><div className="text-red-600">You must be logged in to view your assignments.</div></PageContainer>;
  }
  return (
    <PageContainer>
      <MyAssignmentList userId={user.id} />
    </PageContainer>
  );
} 