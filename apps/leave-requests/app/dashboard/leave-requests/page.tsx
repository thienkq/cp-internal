import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { createServerClient } from "@workspace/supabase";
import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { Filter, Download, Calendar } from "lucide-react";
import { LeaveRequestYearFilter } from "@/components/leave/leave-request-year-filter";
import type { LeaveRequest } from "@/types";

interface PageProps {
  searchParams: Promise<{
    year?: string;
  }>;
}

export default async function UserLeaveRequestsPage({ searchParams }: PageProps) {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get current year as default
  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = await searchParams;
  const selectedYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  // Fetch user's leave requests for the selected year
  const startOfYear = new Date(selectedYear, 0, 1).toISOString();
  const endOfYear = new Date(selectedYear, 11, 31).toISOString();

  const { data: leaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!approved_by_id(full_name)
    `)
    .eq("user_id", user.id)
    .gte("start_date", startOfYear)
    .lte("start_date", endOfYear)
    .order("start_date", { ascending: false });

  // Separate requests by status for better organization
  const pendingRequests = leaveRequests?.filter(req => req.status === "pending") || [];
  const approvedRequests = leaveRequests?.filter(req => req.status === "approved") || [];
  const rejectedRequests = leaveRequests?.filter(req => req.status === "rejected") || [];
  const canceledRequests = leaveRequests?.filter(req => req.status === "canceled") || [];

  const getStatusCount = (status: string) => {
    return leaveRequests?.filter(req => req.status === status).length || 0;
  };

  const getTotalDays = () => {
    if (!leaveRequests) return 0;
    
    return leaveRequests.reduce((total, req) => {
      if (req.status === "approved") {
        if (req.is_half_day) {
          return total + 0.5;
        }
        if (req.end_date && req.start_date !== req.end_date) {
          const start = new Date(req.start_date);
          const end = new Date(req.end_date);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          return total + diffDays;
        }
        return total + 1;
      }
      return total;
    }, 0);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Leave Requests</h1>
            <p className="text-gray-600">View and track all your leave requests for {selectedYear}</p>
          </div>
          <div className="flex items-center gap-2">
            <LeaveRequestYearFilter selectedYear={selectedYear} />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{getStatusCount("pending")}</div>
            <div className="text-sm text-gray-500">Pending</div>
            <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{getStatusCount("approved")}</div>
            <div className="text-sm text-gray-500">Approved</div>
            <div className="text-xs text-gray-400 mt-1">This year</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-red-600">{getStatusCount("rejected")}</div>
            <div className="text-sm text-gray-500">Rejected</div>
            <div className="text-xs text-gray-400 mt-1">This year</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{getTotalDays()}</div>
            <div className="text-sm text-gray-500">Days Used</div>
            <div className="text-xs text-gray-400 mt-1">Approved requests</div>
          </Card>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pending Requests</h2>
            <LeaveRequestList
              leaveRequests={pendingRequests}
              title="Requests Awaiting Approval"
              showUserColumn={false}
              showActions={false}
            />
          </div>
        )}

        {/* Approved Requests */}
        {approvedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Approved Requests</h2>
            <LeaveRequestList
              leaveRequests={approvedRequests}
              title="Approved Requests"
              showUserColumn={false}
              showActions={false}
            />
          </div>
        )}

        {/* Rejected Requests */}
        {rejectedRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rejected Requests</h2>
            <LeaveRequestList
              leaveRequests={rejectedRequests}
              title="Rejected Requests"
              showUserColumn={false}
              showActions={false}
            />
          </div>
        )}

        {/* Canceled Requests */}
        {canceledRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Canceled Requests</h2>
            <LeaveRequestList
              leaveRequests={canceledRequests}
              title="Canceled Requests"
              showUserColumn={false}
              showActions={false}
            />
          </div>
        )}

        {/* All Requests for the Year */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Requests for {selectedYear}</h2>
          <LeaveRequestList
            leaveRequests={leaveRequests || []}
            title={`${selectedYear} Leave History`}
            showUserColumn={false}
            showActions={false}
          />
        </div>

        {/* No Requests Message */}
        {(!leaveRequests || leaveRequests.length === 0) && (
          <Card>
            <CardContent className="p-8 text-center">
              <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
              <p className="text-gray-500 mb-4">
                You haven't submitted any leave requests for {selectedYear} yet.
              </p>
              <Button asChild>
                <a href="/dashboard/leave/new">Submit New Request</a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
} 