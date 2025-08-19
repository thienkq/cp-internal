import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container"
import { AnniversarySection } from "@/components/dashboard/anniversary-section";
import { LeaveBalanceSection } from "@/components/dashboard/leave-balance-section";
import { LeaveRequestsSection } from "@/components/dashboard/leave-requests-section";
export default async function DashboardPage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user data including date_of_birth
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return (
      <PageContainer>
        <div className="text-red-600">Failed to load user data.</div>
      </PageContainer>
    );
  }

  // Fetch real pending leave requests
  const { data: pendingRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending");

  // Fetch real recent leave requests with joins
  const { data: recentRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!leave_requests_approved_by_id_fkey(full_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const userName = userData.full_name || user.email || "User";

  return (
    <PageContainer>
      {/* Anniversary Section */}
      <AnniversarySection
        userName={userName}
        dateOfBirth={userData.date_of_birth}
        startDate={userData.start_date}
        userId={user.id}
      />

      {/* Greeting and Start Date Reminder */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
          <a 
            href="/dashboard/leave-requests" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Leave Requests →
          </a>
        </div>
        
        {/* Start Date Reminder Banner */}
        {!userData.start_date && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-yellow-800">
                <p className="font-medium">Start Date Not Set</p>
                <p className="text-sm">Your leave balance is currently set to the default rate. 
                <a href="/dashboard/profile" className="text-yellow-700 underline ml-1">Set your start date</a> to get the correct leave balance based on your tenure.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leave Balance Section */}
      <LeaveBalanceSection
        startDate={userData.start_date}
        userId={user.id}
        pendingRequestsCount={pendingRequests?.length || 0}
      />

      {/* Leave Requests Section */}
      <LeaveRequestsSection leaveRequests={recentRequests || []} />
    </PageContainer>
  )
}
