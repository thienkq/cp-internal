import { PageContainer } from '@workspace/ui/components/page-container';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { LeaveTypeTabs } from '@/components/leave/leave-type-tabs';
import { Button } from '@workspace/ui/components/button';
import { getCurrentUser } from '@workspace/supabase';
import { getDb } from '@/db';
import { leaveRequests, leaveTypes, users } from '@/db/schema';
import { eq, gte, lte, desc, and } from 'drizzle-orm';
import { calculateWorkingDays } from '@/lib/utils';
// Removed direct table usage; tables are rendered inside tabs component
import {
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarCheck2,
  Layers,
  Gift,
  Gauge,
  Ban,
} from 'lucide-react';
import { LeaveRequestYearFilter } from '@/components/leave/leave-request-year-filter';
import { calculateLeaveBalance } from '@/lib/leave-quota-utils';
import { getUserBonusLeaveSummary } from '@/lib/bonus-leave-utils';

interface PageProps {
  searchParams: Promise<{
    year?: string;
    tab?: string;
  }>;
}

export default async function UserLeaveRequestsPage({
  searchParams,
}: PageProps) {
  const { user } = await getCurrentUser();

  const userId = user?.id as string;

  // Get current year as default
  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = await searchParams;
  const selectedYear = resolvedSearchParams.year
    ? parseInt(resolvedSearchParams.year)
    : currentYear;

  // Fetch user's leave requests for the selected year
  const startOfYear = new Date(selectedYear, 0, 1).toISOString().split('T')[0] as string;
  const endOfYear = new Date(selectedYear, 11, 31).toISOString().split('T')[0] as string;

  const db = getDb();
  
  const leaveRequestsData = await db
    .select({
      id: leaveRequests.id,
      user_id: leaveRequests.user_id,
      leave_type_id: leaveRequests.leave_type_id,
      projects: leaveRequests.projects,
      internal_notifications: leaveRequests.internal_notifications,
      external_notifications: leaveRequests.external_notifications,
      current_manager_id: leaveRequests.current_manager_id,
      backup_id: leaveRequests.backup_id,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
      is_half_day: leaveRequests.is_half_day,
      half_day_type: leaveRequests.half_day_type,
      message: leaveRequests.message,
      emergency_contact: leaveRequests.emergency_contact,
      status: leaveRequests.status,
      approval_notes: leaveRequests.approval_notes,
      cancel_reason: leaveRequests.cancel_reason,
      approved_by_id: leaveRequests.approved_by_id,
      approved_at: leaveRequests.approved_at,
      canceled_at: leaveRequests.canceled_at,
      created_at: leaveRequests.created_at,
      updated_at: leaveRequests.updated_at,
      leave_type: {
        name: leaveTypes.name,
        description: leaveTypes.description,
        is_paid: leaveTypes.is_paid,
      },
      approved_by: {
        full_name: users.full_name,
      },
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .leftJoin(users, eq(leaveRequests.approved_by_id, users.id))
    .where(
      and(
        eq(leaveRequests.user_id, userId),
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    )
    .orderBy(desc(leaveRequests.start_date));

  // Type for the leave request data
  type LeaveRequestData = {
    id: string;
    user_id: string;
    leave_type_id: number;
    projects: unknown;
    internal_notifications: string[] | null;
    external_notifications: string[] | null;
    current_manager_id: string | null;
    backup_id: string | null;
    start_date: string;
    end_date: string | null;
    is_half_day: boolean;
    half_day_type: string | null;
    message: string | null;
    emergency_contact: string | null;
    status: string;
    approval_notes: string | null;
    cancel_reason: string | null;
    approved_by_id: string | null;
    approved_at: string | null;
    canceled_at: string | null;
    created_at: string;
    updated_at: string;
    leave_type: {
      name: string | null;
      description: string | null;
      is_paid: boolean | null;
    } | null;
    approved_by: {
      full_name: string | null;
    } | null;
  };

  // Helper functions for stats
  const getStatusCount = (status: string) => {
    return leaveRequestsData?.filter((req: LeaveRequestData) => req.status === status).length || 0;
  };

  type RequestLike = {
    start_date: string;
    end_date?: string | null;
    is_half_day?: boolean | null;
    status?: string;
    leave_type?: { is_paid?: boolean | null; name?: string | null } | null;
  };

  const getRequestDays = (req: RequestLike) => {
    return calculateWorkingDays(
      req.start_date, 
      req.end_date || null, 
      req.is_half_day || false
    );
  };

  const getTotalDays = () => {
    if (!leaveRequestsData) return 0;

    return leaveRequestsData.reduce((total: number, req: LeaveRequestData) => {
      // Only count paid leave types against quota (exclude unpaid leave)
      if (req.status === 'approved' && req.leave_type?.is_paid) {
        return total + getRequestDays(req);
      }
      return total;
    }, 0);
  };

  // Extended balances
  const leaveBalance = await calculateLeaveBalance(userId, selectedYear);
  const bonusSummary = await getUserBonusLeaveSummary(userId, selectedYear);


  const unpaidUsedDays = (leaveRequestsData || []).reduce((total: number, req: LeaveRequestData) => {
    if (
      req.status === 'approved' &&
      req.leave_type &&
      req.leave_type.is_paid === false
    ) {
      return total + getRequestDays(req);
    }
    return total;
  }, 0);

  // Leave type specific helpers
  type LeaveTypeName = 'Annual Leave' | 'Emergency Leave' | 'Wedding Leave' | 'Unpaid Leave';

  const getRequestDaysSafe = (req: RequestLike) => getRequestDays(req);

  const filterByType = (typeName: LeaveTypeName) => {
    return (leaveRequestsData || []).filter((req: LeaveRequestData) => req.leave_type && req.leave_type.name === typeName);
  };

  const getTypeStats = (typeName: LeaveTypeName) => {
    const items = filterByType(typeName);
    const pending = items.filter((r: LeaveRequestData) => r.status === 'pending');
    const approved = items.filter((r: LeaveRequestData) => r.status === 'approved');
    const rejected = items.filter((r: LeaveRequestData) => r.status === 'rejected');

    const approvedDays = approved.reduce((sum: number, r: LeaveRequestData) => sum + getRequestDaysSafe(r), 0);
    const pendingDays = pending.reduce((sum: number, r: LeaveRequestData) => sum + getRequestDaysSafe(r), 0);

    return {
      total: items.length,
      pendingCount: pending.length,
      approvedCount: approved.length,
      rejectedCount: rejected.length,
      approvedDays,
      pendingDays,
    };
  };

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold text-foreground'>
              My Time Off Requests
            </h1>
            <p className='text-muted-foreground'>
              View and track all your time off requests for {selectedYear}
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <LeaveRequestYearFilter selectedYear={selectedYear} />
            <Button variant='outline' size='sm'>
              <Download className='h-4 w-4 mr-2' />
              Export
            </Button>
          </div>
        </div>

        {/* Leave Balances */}
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>Leave Balance</h2>
              <p className='text-muted-foreground'>
                Your time off overview for {selectedYear}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
            {/* Total Quota Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-primary/10 rounded-lg'>
                    <Layers className='w-5 h-5 text-primary' />
                  </div>
                  <Badge 
                    variant={leaveBalance?.isOnboardingYear ? 'yellow' : 'blue'}
                    className='text-xs'
                  >
                    {leaveBalance?.isOnboardingYear ? 'Prorated' : `Year ${leaveBalance?.employmentYear}`}
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-primary'>
                  {leaveBalance?.totalQuota ?? 0}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Total Quota</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  Base annual paid leave
                </div>
              </CardContent>
            </Card>

            {/* Available Days Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                    <Gauge className='w-5 h-5 text-green-600' />
                  </div>
                  <div className='flex items-center gap-1 text-green-600'>
                    <span className='text-xs font-medium'>Available</span>
                  </div>
                </div>
                <CardTitle className='text-3xl font-bold text-green-600'>
                  {leaveBalance?.availableDays ?? 0}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Days Available</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  Excludes bonus leave
                </div>
              </CardContent>
            </Card>

            {/* Committed Days Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg'>
                    <CalendarCheck2 className='w-5 h-5 text-orange-600' />
                  </div>
                  <div className='flex items-center gap-1 text-orange-600'>
                    <span className='text-xs font-medium'>Committed</span>
                  </div>
                </div>
                <CardTitle className='text-3xl font-bold text-orange-600'>
                  {(leaveBalance?.usedDays ?? 0) + (leaveBalance?.pendingDays ?? 0)}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Days Committed</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>{leaveBalance?.usedDays ?? 0} approved</span>
                  <span>•</span>
                  <span>{leaveBalance?.pendingDays ?? 0} pending</span>
                </div>
              </CardContent>
            </Card>

            {/* Bonus Leave Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
                    <Gift className='w-5 h-5 text-purple-600' />
                  </div>
                  <Badge 
                    variant={bonusSummary?.total_granted ? 'green' : 'outline'}
                    className='text-xs'
                  >
                    {bonusSummary?.total_granted ? 'Active' : 'None'}
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-purple-600'>
                  {bonusSummary?.total_granted ?? 0}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Bonus Leave</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  {bonusSummary?.total_granted 
                    ? 'Additional days granted' 
                    : 'No bonus leave this year'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Usage Progress Bar */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Usage Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {/* Progress Bar */}
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Days Used</span>
                    <span className='font-medium'>
                      {leaveBalance?.totalQuota ? 
                        (((leaveBalance?.usedDays ?? 0) + (leaveBalance?.pendingDays ?? 0)) / leaveBalance.totalQuota * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div 
                      className='bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300'
                      style={{ 
                        width: `${leaveBalance?.totalQuota ? 
                          Math.min(((leaveBalance?.usedDays ?? 0) + (leaveBalance?.pendingDays ?? 0)) / leaveBalance.totalQuota * 100, 100) : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Breakdown */}
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-2'>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-green-600'>{leaveBalance?.availableDays ?? 0}</div>
                    <div className='text-sm font-medium text-muted-foreground'>Available</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-blue-600'>{leaveBalance?.usedDays ?? 0}</div>
                    <div className='text-sm font-medium text-muted-foreground'>Approved</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-orange-600'>{leaveBalance?.pendingDays ?? 0}</div>
                    <div className='text-sm font-medium text-muted-foreground'>Pending</div>
                  </div>
                  <div className='text-center'>
                    <div className='text-lg font-semibold text-purple-600'>{unpaidUsedDays}</div>
                    <div className='text-sm font-medium text-muted-foreground'>Unpaid</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-2xl font-bold text-foreground'>Request Statistics</h2>
              <p className='text-muted-foreground'>
                Summary of your leave requests for {selectedYear}
              </p>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
            {/* Pending Requests */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg'>
                    <Clock className='w-5 h-5 text-orange-600' />
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    Awaiting
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-orange-600'>
                  {getStatusCount('pending')}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Pending</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  Waiting for manager approval
                </div>
              </CardContent>
            </Card>

            {/* Approved Requests */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                    <CheckCircle2 className='w-5 h-5 text-green-600' />
                  </div>
                  <Badge variant='green' className='text-xs'>
                    Approved
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-green-600'>
                  {getStatusCount('approved')}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Approved</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  This year
                </div>
              </CardContent>
            </Card>

            {/* Rejected Requests */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-red-100 dark:bg-red-900/20 rounded-lg'>
                    <XCircle className='w-5 h-5 text-red-600' />
                  </div>
                  <Badge variant='destructive' className='text-xs'>
                    Rejected
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-red-600'>
                  {getStatusCount('rejected')}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Rejected</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  This year
                </div>
              </CardContent>
            </Card>

            {/* Paid Days Used */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg'>
                    <CalendarCheck2 className='w-5 h-5 text-blue-600' />
                  </div>
                  <Badge variant='blue' className='text-xs'>
                    Used
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-blue-600'>
                  {getTotalDays()}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Paid Days Used</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  Counted toward quota
                </div>
              </CardContent>
            </Card>

            {/* Unpaid Days Used */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg'>
                    <Ban className='w-5 h-5 text-gray-600' />
                  </div>
                  <Badge variant='outline' className='text-xs'>
                    Unpaid
                  </Badge>
                </div>
                <CardTitle className='text-3xl font-bold text-gray-600'>
                  {unpaidUsedDays}
                </CardTitle>
                <p className='text-sm text-muted-foreground'>Unpaid Days Used</p>
              </CardHeader>
              <CardContent className='pt-0'>
                <div className='text-xs text-muted-foreground'>
                  Not counted toward quota
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* By Leave Type */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold text-foreground'>By Leave Type</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
            {(['Annual Leave','Emergency Leave','Wedding Leave','Unpaid Leave'] as const).map((lt) => {
              const s = getTypeStats(lt);
              const isUnpaid = lt === 'Unpaid Leave';
              return (
                <Card key={lt} className='p-5 md:p-6'>
                  <div className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='text-base font-semibold'>{lt}</div>
                      <div className='text-xs text-muted-foreground'>{isUnpaid ? 'Unpaid' : 'Paid'}</div>
                    </div>
                    <div className='grid grid-cols-2 gap-3 text-sm'>
                      <div>
                        <div className='text-muted-foreground'>Approved</div>
                        <div className={`${isUnpaid ? 'text-foreground' : 'text-emerald-600'} text-xl font-bold`}>
                          {s.approvedCount}
                        </div>
                        <div className='text-xs text-muted-foreground/70'>Requests</div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Pending</div>
                        <div className='text-primary text-xl font-bold'>{s.pendingCount}</div>
                        <div className='text-xs text-muted-foreground/70'>Requests</div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Approved Days</div>
                        <div className='text-foreground text-xl font-bold'>{s.approvedDays}</div>
                      </div>
                      <div>
                        <div className='text-muted-foreground'>Pending Days</div>
                        <div className='text-foreground text-xl font-bold'>{s.pendingDays}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* All Requests for the Year - Tabbed View by Leave Type */}
        <div className='space-y-4'>
          <h2 className='text-xl font-semibold text-foreground'>
            {selectedYear} Requests by Leave Type
          </h2>
          <LeaveTypeTabs
            selectedTab={resolvedSearchParams.tab || 'all'}
            selectedYear={selectedYear}
            all={(leaveRequestsData || []) as any}
            annual={filterByType('Annual Leave') as any}
            emergency={filterByType('Emergency Leave') as any}
            wedding={filterByType('Wedding Leave') as any}
            unpaid={filterByType('Unpaid Leave') as any}
          />
        </div>
      </div>
    </PageContainer>
  );
}
