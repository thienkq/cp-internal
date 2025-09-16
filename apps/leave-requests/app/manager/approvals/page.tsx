import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Clock, AlertCircle } from "lucide-react";

export default async function ManagerApprovalsPage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user data to confirm manager role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["manager", "admin"].includes(userData.role)) {
    redirect("/dashboard");
  }

  // Fetch pending leave requests where current user is the manager
  const { data: pendingRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      user:users!leave_requests_user_id_fkey(id, full_name, email),
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!leave_requests_approved_by_id_fkey(full_name)
    `)
    .eq("current_manager_id", user.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true }); // Oldest first for priority

  // Separate urgent requests (starting soon)
  const now = new Date();
  const urgentThreshold = new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now

  const urgentRequests = pendingRequests?.filter(req => {
    const startDate = new Date(req.start_date);
    return startDate <= urgentThreshold;
  }) || [];

  const regularRequests = pendingRequests?.filter(req => {
    const startDate = new Date(req.start_date);
    return startDate > urgentThreshold;
  }) || [];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground mt-2">
            Review and approve leave requests from your team members
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Requests awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{urgentRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Starting within 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regular</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{regularRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Future requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* No pending requests message */}
        {(!pendingRequests || pendingRequests.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You have no pending leave requests to approve. Great job staying on top of your team's requests!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Urgent Requests */}
        {urgentRequests.length > 0 && (
          <Card className="border-destructive/20">
            <CardHeader className="bg-destructive/5">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Urgent - Starting Soon
              </CardTitle>
              <p className="text-sm text-destructive/80">
                These requests start within 7 days and need immediate attention
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <LeaveRequestList
                leaveRequests={urgentRequests}
                title=""
                showUserColumn={true}
                showActions={true}
                isManagerView={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Regular Requests */}
        {regularRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Other Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <LeaveRequestList
                leaveRequests={regularRequests}
                title=""
                showUserColumn={true}
                showActions={true}
                isManagerView={true}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}