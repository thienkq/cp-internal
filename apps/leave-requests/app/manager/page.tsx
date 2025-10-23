import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Calendar, Clock, Users, CheckSquare } from "lucide-react";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { getDb } from "@/db";
import { users, leaveRequests } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export default async function ManagerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user data to confirm manager role
  const db = getDb();
  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  if (!userData || !["manager", "admin"].includes(userData.role)) {
    redirect("/dashboard");
  }

  // Fetch leave requests where current user is the manager
  const teamRequests = await db
    .select()
    .from(leaveRequests)
    .where(eq(leaveRequests.current_manager_id, user.id))
    .orderBy(desc(leaveRequests.created_at));

  // Get statistics
  const pendingRequests = teamRequests?.filter(req => req.status === 'pending') || [];
  const approvedRequests = teamRequests?.filter(req => req.status === 'approved') || [];
  const recentRequests = teamRequests?.slice(0, 5) || [];

  // Get unique team members
  const teamMembers = teamRequests?.reduce((acc: any[], req: any) => {
    if (req.user && !acc.find((member: any) => member.id === req.user.id)) {
      acc.push(req.user);
    }
    return acc;
  }, [] as any[]) || [];

  const managerName = userData.full_name || user.email || "Manager";

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {managerName}! Manage your team's leave requests.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Requests awaiting your approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved This Month</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Requests you've approved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Members</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-muted-foreground">
                People reporting to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Calendar className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamRequests?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                All team leave requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Section */}
        {pendingRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Pending Approvals
                <Badge variant="secondary">{pendingRequests.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveRequestList
                leaveRequests={pendingRequests as any}
                title=""
                showUserColumn={true}
                showActions={true}
                isManagerView={true}
              />
            </CardContent>
          </Card>
        )}

        {/* Recent Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Team Requests</h2>
            <div className="flex items-center gap-2">
              <a href="/manager/leave-requests" className="text-primary text-sm hover:underline">
                View All Requests
              </a>
            </div>
          </div>
          
          <LeaveRequestList
            leaveRequests={recentRequests as any}
            title="Latest Leave Requests"
            showUserColumn={true}
            showActions={true}
            isManagerView={true}
          />
        </div>
      </div>
    </PageContainer>
  );
}