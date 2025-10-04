import { PageContainer } from '@workspace/ui/components/page-container';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Badge } from '@workspace/ui/components/badge';
import { LeaveTypeTabs } from '@/components/leave/leave-type-tabs';
import { Button } from '@workspace/ui/components/button';
import { getCurrentUser } from '@workspace/supabase';
import { getDb } from '@/db';
import {
  leaveRequests,
  leaveTypes as leaveTypesTable,
  users,
} from '@/db/schema';
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
import { LeaveRequest } from '@/types';
import { LeaveType } from '@/types/leave-request';

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
  const startOfYear = new Date(selectedYear, 0, 1)
    .toISOString()
    .split('T')[0] as string;
  const endOfYear = new Date(selectedYear, 11, 31)
    .toISOString()
    .split('T')[0] as string;

  const db = getDb();

  const leaveRequestsData = (await db
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
        name: leaveTypesTable.name,
        description: leaveTypesTable.description,
        is_paid: leaveTypesTable.is_paid,
      },
      approved_by: {
        full_name: users.full_name,
      },
    })
    .from(leaveRequests)
    .leftJoin(
      leaveTypesTable,
      eq(leaveRequests.leave_type_id, leaveTypesTable.id)
    )
    .leftJoin(users, eq(leaveRequests.approved_by_id, users.id))
    .where(
      and(
        eq(leaveRequests.user_id, userId),
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    )
    .orderBy(desc(leaveRequests.start_date))) as LeaveRequest[];

  const listLeaveTypes = (await db
    .select()
    .from(leaveTypesTable)) as LeaveType[];

  // Helper functions for stats
  const getStatusCount = (status: string) => {
    return (
      leaveRequestsData?.filter((req: LeaveRequest) => req.status === status)
        .length || 0
    );
  };

  const getRequestDays = (req: LeaveRequest) => {
    return calculateWorkingDays(
      req.start_date,
      req.end_date || null,
      req.is_half_day || false
    );
  };

  const getTotalDays = () => {
    if (!leaveRequestsData) return 0;

    return leaveRequestsData.reduce((total: number, req: LeaveRequest) => {
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

  const unpaidUsedDays = (leaveRequestsData || []).reduce(
    (total: number, req: LeaveRequest) => {
      if (
        req.status === 'approved' &&
        req.leave_type &&
        req.leave_type.is_paid === false
      ) {
        return total + getRequestDays(req);
      }
      return total;
    },
    0
  );

  const filterByType = (leaveType: LeaveType) => {
    return (leaveRequestsData || []).filter(
      (req: LeaveRequest) => req.leave_type_id === leaveType.id
    );
  };


  const leaveRequestsByType = listLeaveTypes.map((lt) => ({
    leaveType: lt,
    leaveRequests: filterByType(lt),
  }));

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
        <div className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
            {/* Main Stats - 2 columns on large screens */}
            <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3'>
            {/* Total Quota Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-1'>
                <div className='flex items-center justify-between'>
                  <div className='p-1 bg-primary/10 rounded-md'>
                    <Layers className='w-3 h-3 text-primary' />
                  </div>
                  <Badge
                    variant={leaveBalance?.isOnboardingYear ? 'yellow' : 'blue'}
                    className='text-xs px-1.5 py-0.5'
                  >
                    {leaveBalance?.isOnboardingYear
                      ? 'Prorated'
                      : `Year ${leaveBalance?.employmentYear}`}
                  </Badge>
                </div>
                <CardTitle className='text-xl font-bold text-primary'>
                  {leaveBalance?.totalQuota ?? 0}
                </CardTitle>
                <p className='text-xs text-muted-foreground'>Total Quota</p>
              </CardHeader>
            </Card>

            {/* Available Days Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-1'>
                <div className='flex items-center justify-between'>
                  <div className='p-1 bg-green-100 dark:bg-green-900/20 rounded-md'>
                    <Gauge className='w-3 h-3 text-green-600' />
                  </div>
                  <div className='flex items-center gap-1 text-green-600'>
                    <span className='text-xs font-medium'>Available</span>
                  </div>
                </div>
                <CardTitle className='text-xl font-bold text-green-600'>
                  {leaveBalance?.availableDays ?? 0}
                </CardTitle>
                <p className='text-xs text-muted-foreground'>Days Available</p>
              </CardHeader>
            </Card>

            {/* Committed Days Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-1'>
                <div className='flex items-center justify-between'>
                  <div className='p-1 bg-orange-100 dark:bg-orange-900/20 rounded-md'>
                    <CalendarCheck2 className='w-3 h-3 text-orange-600' />
                  </div>
                  <div className='flex items-center gap-1 text-orange-600'>
                    <span className='text-xs font-medium'>Submitted</span>
                  </div>
                </div>
                <CardTitle className='text-xl font-bold text-orange-600'>
                  {(leaveBalance?.usedDays ?? 0) +
                    (leaveBalance?.pendingDays ?? 0)}
                </CardTitle>
                <div className='flex items-center justify-between'>
                  <p className='text-xs text-muted-foreground'>Days Submitted</p>
                  <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                    <span>{leaveBalance?.usedDays ?? 0} approved</span>
                    <span>•</span>
                    <span>{leaveBalance?.pendingDays ?? 0} pending</span>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Bonus Leave Card */}
            <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
              <CardHeader className='pb-1'>
                <div className='flex items-center justify-between'>
                  <div className='p-1 bg-purple-100 dark:bg-purple-900/20 rounded-md'>
                    <Gift className='w-3 h-3 text-purple-600' />
                  </div>
                  <Badge
                    variant={bonusSummary?.total_granted ? 'green' : 'outline'}
                    className='text-xs px-1.5 py-0.5'
                  >
                    {bonusSummary?.total_granted ? 'Active' : 'None'}
                  </Badge>
                </div>
                <CardTitle className='text-xl font-bold text-purple-600'>
                  {bonusSummary?.total_granted ?? 0}
                </CardTitle>
                <p className='text-xs text-muted-foreground'>Bonus Leave</p>
              </CardHeader>
            </Card>
            </div>

            {/* Integrated Usage Overview - 1 column on large screens */}
            <Card className='lg:col-span-1'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base flex items-center gap-2'>
                  <Gauge className='w-3 h-3' />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {/* Progress Bar */}
                <div className='space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Days Used</span>
                    <span className='font-medium'>
                      {leaveBalance?.totalQuota
                        ? (
                            (((leaveBalance?.usedDays ?? 0) +
                              (leaveBalance?.pendingDays ?? 0)) /
                              leaveBalance.totalQuota) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className='w-full bg-muted rounded-full h-2'>
                    <div
                      className='bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${
                          leaveBalance?.totalQuota
                            ? Math.min(
                                (((leaveBalance?.usedDays ?? 0) +
                                  (leaveBalance?.pendingDays ?? 0)) /
                                  leaveBalance.totalQuota) *
                                  100,
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Compact Breakdown */}
                <div className='space-y-2'>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5'>
                      <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                      <span className='text-xs text-muted-foreground'>Available</span>
                    </div>
                    <span className='text-xs font-semibold text-green-600'>{leaveBalance?.availableDays ?? 0}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5'>
                      <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                      <span className='text-xs text-muted-foreground'>Approved</span>
                    </div>
                    <span className='text-xs font-semibold text-blue-600'>{leaveBalance?.usedDays ?? 0}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5'>
                      <div className='w-1.5 h-1.5 bg-orange-500 rounded-full'></div>
                      <span className='text-xs text-muted-foreground'>Pending</span>
                    </div>
                    <span className='text-xs font-semibold text-orange-600'>{leaveBalance?.pendingDays ?? 0}</span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='flex items-center gap-1.5'>
                      <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
                      <span className='text-xs text-muted-foreground'>Unpaid</span>
                    </div>
                    <span className='text-xs font-semibold text-purple-600'>{unpaidUsedDays}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            all={leaveRequestsData || []}
            leaveRequestsByType={leaveRequestsByType}
          />
        </div>
      </div>
    </PageContainer>
  );
}
