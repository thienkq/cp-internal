import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { createServerClient } from "@workspace/supabase";
import { AllLeaveRequestsTable } from "@/components/admin/all-leave-requests-table";
import { Button } from "@workspace/ui/components/button";
import { FileText, Filter, Download } from "lucide-react";
import Link from "next/link";

export default async function AdminLeaveRequestsPage() {
  const supabase = await createServerClient();
  
  // Fetch all leave requests with user and leave type information
  const { data: allLeaveRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      user:users!leave_requests_user_id_fkey(full_name, email),
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!leave_requests_approved_by_id_fkey(full_name)
    `)
    .order("created_at", { ascending: false });



  const getStatusCount = (status: string) => {
    return allLeaveRequests?.filter(req => req.status === status).length || 0;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Leave Requests Management</h1>
            <p className="text-muted-foreground">Manage and approve leave requests from all users</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
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
            <div className="text-sm text-muted-foreground">Pending</div>
            <div className="text-xs text-muted-foreground/70 mt-1">Awaiting approval</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{getStatusCount("approved")}</div>
            <div className="text-sm text-muted-foreground">Approved</div>
            <div className="text-xs text-muted-foreground/70 mt-1">This period</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-destructive">{getStatusCount("rejected")}</div>
            <div className="text-sm text-muted-foreground">Rejected</div>
            <div className="text-xs text-muted-foreground/70 mt-1">This period</div>
          </Card>
          <Card className="p-6 text-center">
            <div className="text-3xl font-bold text-muted-foreground">{getStatusCount("canceled")}</div>
            <div className="text-sm text-muted-foreground">Canceled</div>
            <div className="text-xs text-muted-foreground/70 mt-1">This period</div>
          </Card>
        </div>

        {/* All Leave Requests */}
        <AllLeaveRequestsTable
          leaveRequests={allLeaveRequests || []}
          title="All Leave Requests"
          showActions={true}
        />
      </div>
    </PageContainer>
  );
} 