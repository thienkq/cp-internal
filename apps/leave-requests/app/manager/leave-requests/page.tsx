import { getCurrentUser } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { LeaveRequestTable } from "@/components/leave/leave-request-table";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Calendar, Clock, CheckSquare, XCircle } from "lucide-react";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

interface PageProps {
  searchParams: Promise<{
    status?: string;
    year?: string;
  }>;
}

export default async function ManagerLeaveRequestsPage({ searchParams }: PageProps) {
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

  // Get search parameters
  const resolvedSearchParams = await searchParams;
  const selectedStatus = resolvedSearchParams.status;
  const currentYear = new Date().getFullYear();
  const selectedYear = resolvedSearchParams.year ? parseInt(resolvedSearchParams.year) : currentYear;

  // Build query filters
  let query = supabase
    .from("leave_requests")
    .select(`
      *,
      user:users!leave_requests_user_id_fkey(id, full_name, email),
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!leave_requests_approved_by_id_fkey(full_name)
    `)
    .eq("current_manager_id", user.id);

  // Filter by status if specified
  if (selectedStatus) {
    query = query.eq("status", selectedStatus);
  }

  // Filter by year
  const startOfYear = new Date(selectedYear, 0, 1).toISOString();
  const endOfYear = new Date(selectedYear, 11, 31).toISOString();
  query = query.gte("start_date", startOfYear).lte("start_date", endOfYear);

  // Execute query
  const { data: leaveRequests } = await query.order("created_at", { ascending: false });

  // Get status counts for current year
  const { data: allRequests } = await supabase
    .from("leave_requests")
    .select("status")
    .eq("current_manager_id", user.id)
    .gte("start_date", startOfYear)
    .lte("start_date", endOfYear);

  const getStatusCount = (status: string) => {
    return allRequests?.filter(req => req.status === status).length || 0;
  };

  const statusFilters = [
    { label: "All", value: "", count: allRequests?.length || 0, icon: Calendar },
    { label: "Pending", value: "pending", count: getStatusCount("pending"), icon: Clock },
    { label: "Approved", value: "approved", count: getStatusCount("approved"), icon: CheckSquare },
    { label: "Rejected", value: "rejected", count: getStatusCount("rejected"), icon: XCircle },
  ];

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Team Leave Requests</h1>
          <p className="text-muted-foreground mt-2">
            Manage leave requests for your team members for {selectedYear}
          </p>
        </div>

        {/* Status Filter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statusFilters.map((filter) => {
            const isActive = selectedStatus === filter.value;
            const IconComponent = filter.icon;
            
            return (
              <Card 
                key={filter.label}
                className={`cursor-pointer transition-colors ${
                  isActive ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <a href={`/manager/leave-requests?status=${filter.value}&year=${selectedYear}`}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{filter.label}</CardTitle>
                    <IconComponent className={`h-4 w-4 ${
                      filter.label === 'Pending' ? 'text-orange-600' :
                      filter.label === 'Approved' ? 'text-green-600' :
                      filter.label === 'Rejected' ? 'text-destructive' : 'text-primary'
                    }`} />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{filter.count}</div>
                  </CardContent>
                </a>
              </Card>
            );
          })}
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">Year:</span>
          <div className="flex gap-2">
            {[currentYear - 1, currentYear, currentYear + 1].map((year) => (
              <Badge
                key={year}
                variant={selectedYear === year ? "default" : "outline"}
                className="cursor-pointer"
              >
                <a href={`/manager/leave-requests?status=${selectedStatus || ''}&year=${year}`}>
                  {year}
                </a>
              </Badge>
            ))}
          </div>
        </div>

        {/* Requests Table */}
        <LeaveRequestTable
          leaveRequests={leaveRequests || []}
          title={`${selectedStatus ? selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1) : 'All'} Leave Requests - ${selectedYear}`}
          showUserColumn={true}
          showActions={true}
          isManagerView={true}
          emptyMessage={
            selectedStatus 
              ? `No ${selectedStatus} leave requests found for ${selectedYear}.`
              : `No leave requests found for ${selectedYear}.`
          }
        />
      </div>
    </PageContainer>
  );
}