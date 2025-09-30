'use client';

import React, { useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import {
  Filter,
  Download,
} from 'lucide-react';
import { LeaveRequest } from '@/types';
import { LeaveTypeTabs } from '@/components/admin/leave-type-tabs';
import { LeaveType } from '@/types/leave-request';
import { calculateWorkingDays } from '@/lib/utils';
import QuickStats from './components/QuickStats';
import UsageOverview from './components/UsageOverview';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import { UserUsage } from './types';
import ListUser from './components/ListUser';

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
  leaveRequestsByType,
  defaultTab,
  selectedYear,
  usersWithUsage,
}: {
  allLeaveRequests: LeaveRequest[];
  leaveRequestsByType: {
    leaveType: LeaveType;
    leaveRequests: LeaveRequest[];
  }[];
  defaultTab: string;
  selectedYear: number;
  usersWithUsage: UserUsage[];
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
      <QuickStats allLeaveRequests={allLeaveRequests} totals={totals} />

      {/* Usage Overview */}
      <UsageOverview allLeaveRequests={allLeaveRequests} totals={totals} />

      {/* All Leave Requests */}
      {/* Top-level Tabs: Leave Types and Users */}
      <div className='space-y-4'>
        <Tabs defaultValue='leave-types' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='leave-types' className='cursor-pointer'>
              Leave Types
            </TabsTrigger>
            <TabsTrigger value='users' className='cursor-pointer'>
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value='leave-types' className='space-y-4'>
            <h2 className='text-xl font-semibold text-foreground'>
              Requests by Leave Type
            </h2>
            <LeaveTypeTabs
              selectedTab={defaultTab || 'all'}
              selectedYear={selectedYear}
              all={allLeaveRequests || []}
              leaveRequestsByType={leaveRequestsByType}
            />
          </TabsContent>

          <TabsContent value='users' className='space-y-4'>
            <ListUser
              usersWithUsage={usersWithUsage}
              selectedYear={selectedYear}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLeaveRequestsPageClient;
