import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { LeaveRequestForm } from "@/components/leave/leave-request-form";

interface EditLeaveRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLeaveRequestPage({ params }: EditLeaveRequestPageProps) {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { id } = await params;

  // Fetch the leave request to edit - ensure user owns it and it's pending
  const { data: leaveRequest, error: requestError } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_type:leave_types(id, name, description, is_paid, supports_half_day, supports_carryover, quota),
      current_manager:users!leave_requests_current_manager_id_fkey(id, full_name, email),
      backup_person:users!leave_requests_backup_id_fkey(id, full_name, email)
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("status", "pending")
    .single();

  if (requestError || !leaveRequest) {
    redirect("/dashboard/leave-requests");
  }

  // Fetch leave types for the form
  const { data: leaveTypes } = await supabase
    .from("leave_types")
    .select("*")
    .order("name");

  // Fetch projects for the form
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name")
    .order("name");

  // Fetch users for manager and backup selection
  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email")
    .order("full_name");

  return (
    <PageContainer>
      <div className="mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Edit Leave Request</h1>
          <p className="text-gray-600 mt-2">
            Make changes to your pending leave request. All relevant parties will be notified of the changes.
          </p>
        </div>

        <LeaveRequestForm
          leaveTypes={leaveTypes || []}
          projects={projects || []}
          users={users || []}
          editMode={{
            isEditing: true,
            requestId: id,
            initialData: leaveRequest
          }}
        />
      </div>
    </PageContainer>
  );
}