'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { AllLeaveRequestsTable } from '@/components/admin/all-leave-requests-table';
import { Button } from '@workspace/ui/components/button';
import { Filter, Download, Layers, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { LeaveRequest } from '@/types';

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
}: {
  allLeaveRequests: LeaveRequest[];
}) => {
  const getStatusCount = (status: string) => {
    return allLeaveRequests?.filter((req) => req.status === status).length || 0;
  };

  const parseDate = (d?: string | null) => (d ? new Date(d) : undefined);

  const calculateWorkingDays = (start: string, end?: string | null, isHalfDay?: boolean) => {
    const startDate = new Date(start);
    const endDate = new Date(end || start);
    let days = 0;
    const current = new Date(startDate);
    while (current <= endDate) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) days += 1;
      current.setDate(current.getDate() + 1);
    }
    if (isHalfDay) days -= 0.5;
    return Math.max(days, 0);
  };

  const totals = (() => {
    const total = allLeaveRequests?.length || 0;
    const paidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (r.status === 'approved' && r.leave_type?.is_paid) {
        return sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day);
      }
      return sum;
    }, 0);
    const unpaidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (r.status === 'approved' && r.leave_type && r.leave_type.is_paid === false) {
        return sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day);
      }
      return sum;
    }, 0);

    const approvalDurations: number[] = (allLeaveRequests || [])
      .filter((r) => r.status === 'approved' && r.approved_at)
      .map((r) => {
        const created = parseDate(r.created_at)?.getTime() || 0;
        const approved = parseDate(r.approved_at || undefined)?.getTime() || 0;
        return approved > created ? approved - created : 0;
      })
      .filter((ms) => ms > 0);
    const avgApprovalMs = approvalDurations.length
      ? Math.round(approvalDurations.reduce((a, b) => a + b, 0) / approvalDurations.length)
      : 0;
    // const avgApprovalDays = avgApprovalMs ? Math.max(0.1, +(avgApprovalMs / (1000 * 60 * 60 * 24)).toFixed(1)) : 0;

    return { total, paidApprovedDays, unpaidApprovedDays };
  })();

  const getTypeStats = () => {
    const byType = new Map<number, { name: string; isPaid?: boolean; counts: { pending: number; approved: number; rejected: number; canceled: number }; approvedDays: number; pendingDays: number }>();
    for (const r of allLeaveRequests || []) {
      const key = r.leave_type_id;
      const entry = byType.get(key) || {
        name: r.leave_type?.name || `Type ${key}`,
        isPaid: r.leave_type?.is_paid,
        counts: { pending: 0, approved: 0, rejected: 0, canceled: 0 },
        approvedDays: 0,
        pendingDays: 0,
      };
      const statusKey: keyof typeof entry.counts = r.status;
      entry.counts[statusKey] = entry.counts[statusKey] + 1;
      if (r.status === 'approved') {
        entry.approvedDays += calculateWorkingDays(r.start_date, r.end_date, r.is_half_day);
      } else if (r.status === 'pending') {
        entry.pendingDays += calculateWorkingDays(r.start_date, r.end_date, r.is_half_day);
      }
      byType.set(key, entry);
    }
    return Array.from(byType.values());
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Leave Requests Management</h1>
          <p className='text-muted-foreground'>
            Manage and approve leave requests from all users
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Filter className='h-4 w-4 mr-2' />
            Filter
          </Button>
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Layers className='w-5 h-5 text-primary' />
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-primary'>
              {totals.total}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Total Requests</p>
          </CardHeader>
        </Card>
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg'>
                <Clock className='w-5 h-5 text-orange-600' />
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-orange-600'>
              {getStatusCount('pending')}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Pending</p>
          </CardHeader>
        </Card>
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                <CheckCircle2 className='w-5 h-5 text-green-600' />
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-green-600'>
              {getStatusCount('approved')}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Approved</p>
          </CardHeader>
        </Card>
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-red-100 dark:bg-red-900/20 rounded-lg'>
                <XCircle className='w-5 h-5 text-red-600' />
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-red-600'>
              {getStatusCount('rejected')}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Rejected</p>
          </CardHeader>
        </Card>
      </div>

      {/* Usage Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-blue-600'>
                {totals.paidApprovedDays}
              </div>
              <div className='text-sm font-medium text-muted-foreground'>
                Paid Days Used
              </div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-purple-600'>
                {totals.unpaidApprovedDays}
              </div>
              <div className='text-sm font-medium text-muted-foreground'>
                Unpaid Days Used
              </div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-orange-600'>
                {getStatusCount('pending')}
              </div>
              <div className='text-sm font-medium text-muted-foreground'>
                Pending Requests
              </div>
            </div>
            {/* <div className='text-center'>
              <div className='text-lg font-semibold text-emerald-600'>
                {totals.avgApprovalDays}
              </div>
              <div className='text-sm font-medium text-muted-foreground'>
                Avg Approval Time (days)
              </div>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* By Leave Type */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold'>By Leave Type</h2>
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6'>
          {getTypeStats().map((t) => (
            <Card key={t.name} className='p-5 md:p-6'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='text-base font-semibold'>{t.name}</div>
                  <div className='text-xs text-muted-foreground'>
                    {t.isPaid === false ? 'Unpaid' : 'Paid'}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-3 text-sm'>
                  <div>
                    <div className='text-muted-foreground'>Approved</div>
                    <div className='text-emerald-600 text-xl font-bold'>
                      {t.counts.approved}
                    </div>
                    <div className='text-xs text-muted-foreground/70'>Requests</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground'>Pending</div>
                    <div className='text-primary text-xl font-bold'>
                      {t.counts.pending}
                    </div>
                    <div className='text-xs text-muted-foreground/70'>Requests</div>
                  </div>
                  <div>
                    <div className='text-muted-foreground'>Approved Days</div>
                    <div className='text-foreground text-xl font-bold'>
                      {t.approvedDays}
                    </div>
                  </div>
                  <div>
                    <div className='text-muted-foreground'>Pending Days</div>
                    <div className='text-foreground text-xl font-bold'>
                      {t.pendingDays}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* All Leave Requests */}
      <AllLeaveRequestsTable
        leaveRequests={allLeaveRequests || []}
        title='All Leave Requests'
        showActions={true}
      />
    </div>
  );
};

export default AdminLeaveRequestsPageClient;
