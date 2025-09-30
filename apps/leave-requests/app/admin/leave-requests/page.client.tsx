'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import {
  Filter,
  Download,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { LeaveRequest } from '@/types';
import { LeaveTypeTabs } from '@/components/admin/leave-type-tabs';
import { LeaveType } from '@/types/leave-request';
import { calculateWorkingDays, getStatusCount } from '@/lib/utils';

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
  leaveRequestsByType,
  defaultTab,
  selectedYear,
}: {
  allLeaveRequests: LeaveRequest[];
  leaveRequestsByType: {
    leaveType: LeaveType;
    leaveRequests: LeaveRequest[];
  }[];
  defaultTab: string;
  selectedYear: number;
}) => {

  const totals = useMemo(() => {
    const total = allLeaveRequests?.length || 0;
    const paidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (r.status === 'approved' && r.leave_type?.is_paid) {
        return (
          sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day)
        );
      }
      return sum;
    }, 0);
    const unpaidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (
        r.status === 'approved' &&
        r.leave_type &&
        r.leave_type.is_paid === false
      ) {
        return (
          sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day)
        );
      }
      return sum;
    }, 0);

    return { total, paidApprovedDays, unpaidApprovedDays };
  }, [allLeaveRequests]);

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
              {getStatusCount(allLeaveRequests, 'pending')}
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
              {getStatusCount(allLeaveRequests, 'approved')}
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
              {getStatusCount(allLeaveRequests, 'rejected')}
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
                {getStatusCount(allLeaveRequests, 'pending')}
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

      {/* All Leave Requests */}
      {/* All Requests for the Year - Tabbed View by Leave Type */}
      <div className='space-y-4'>
        <h2 className='text-xl font-semibold text-foreground'>
          Requests by Leave Type
        </h2>
        <LeaveTypeTabs
          selectedTab={defaultTab || 'all'}
          selectedYear={selectedYear}
          all={allLeaveRequests || []}
          leaveRequestsByType={leaveRequestsByType}
        />
      </div>
    </div>
  );
};

export default AdminLeaveRequestsPageClient;
