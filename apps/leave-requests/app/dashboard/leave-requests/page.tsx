import { PageContainer } from "@workspace/ui/components/page-container";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { getCurrentUser } from "@workspace/supabase";
import { LeaveRequestTable } from "@/components/leave/leave-request-table";
import { Download } from "lucide-react";
import { LeaveRequestYearFilter } from "@/components/leave/leave-request-year-filter";

interface PageProps {
  searchParams: Promise<{
    year?: string;
  }>;
}

export default async function UserLeaveRequestsPage({ searchParams }: PageProps) {
  const { user, supabase } = await getCurrentUser();

  const userId = user?.id as string;

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
      leave_type:leave_types(name, description, is_paid),
      projects,
      approved_by:users!approved_by_id(full_name)
    `)
    .eq("user_id", userId)
    .gte("start_date", startOfYear)
    .lte("start_date", endOfYear)
    .order("start_date", { ascending: false });

  // Helper functions for stats
  const getStatusCount = (status: string) => {
    return leaveRequests?.filter(req => req.status === status).length || 0;
  };

  const getTotalDays = () => {
    if (!leaveRequests) return 0;
    
    return leaveRequests.reduce((total, req) => {
      // Only count paid leave types against quota (exclude unpaid leave)
      if (req.status === "approved" && req.leave_type?.is_paid) {
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
            <div className="text-sm text-gray-500">Quota Days Used</div>
            <div className="text-xs text-gray-400 mt-1">Paid leave only</div>
          </Card>
        </div>

        {/* All Requests for the Year - Table View */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">All Requests for {selectedYear}</h2>
          <LeaveRequestTable
            leaveRequests={leaveRequests || []}
            title={`${selectedYear} Leave History`}
            showUserColumn={false}
            showActions={false}
            showUserActions={true}
            emptyMessage={`You haven't submitted any leave requests for ${selectedYear} yet.`}
          />
        </div>


      </div>
    </PageContainer>
  );
} 