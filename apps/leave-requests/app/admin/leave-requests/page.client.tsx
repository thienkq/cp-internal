'use client';

import React, { useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Download } from 'lucide-react';
import { Badge } from '@workspace/ui/components/badge';
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
import { useSearchParams } from 'next/navigation';
import { UserUsage } from './types';
import ListUser from './components/ListUser';
import FilterDrawer from './components/FilterDrawer';

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
  leaveRequestsByType,
  defaultTab,
  selectedYear,
  usersWithUsage,
  selectedUserId,
}: {
  allLeaveRequests: LeaveRequest[];
  leaveRequestsByType: {
    leaveType: LeaveType;
    leaveRequests: LeaveRequest[];
  }[];
  defaultTab: string;
  selectedYear: number;
  usersWithUsage: UserUsage[];
  selectedUserId?: string;
}) => {
  const searchParams = useSearchParams();

  // Applied values are derived from URL (searchParams) with server-provided fallbacks
  const appliedYear = React.useMemo(() => {
    const y = searchParams?.get('year');
    return y ? parseInt(y) : selectedYear;
  }, [searchParams, selectedYear]);
  const appliedEmployeeId = React.useMemo(() => {
    return searchParams?.get('userId') || selectedUserId || '';
  }, [searchParams, selectedUserId]);

  const appliedEmployee = React.useMemo(() => {
    if (!appliedEmployeeId) return null;
    return usersWithUsage.find((u) => u.id === appliedEmployeeId) || null;
  }, [usersWithUsage, appliedEmployeeId]);

  // Keep original totals logic removed here since QuickStats/UsageOverview now use filtered data


  // yearsOptions moved into FilterDrawer

  const filteredUsersForTab = React.useMemo(() => {
    if (!appliedEmployeeId) return usersWithUsage;
    return usersWithUsage.filter((u) => u.id === appliedEmployeeId);
  }, [usersWithUsage, appliedEmployeeId]);

  // Filter leave requests based on year and employee
  const filteredLeaveRequests = React.useMemo(() => {
    let filtered = allLeaveRequests || [];
    
    // Filter by year
    if (appliedYear) {
      filtered = filtered.filter((req) => {
        const reqYear = new Date(req.start_date).getFullYear();
        return reqYear === appliedYear;
      });
    }
    
    // Filter by employee
    if (appliedEmployeeId) {
      filtered = filtered.filter((req) => req.user_id === appliedEmployeeId);
    }
    
    return filtered;
  }, [allLeaveRequests, appliedYear, appliedEmployeeId]);

  // Filter leaveRequestsByType according to the same applied filters
  const filteredLeaveRequestsByType = React.useMemo(() => {
    return (leaveRequestsByType || []).map((entry) => ({
      leaveType: entry.leaveType,
      leaveRequests: (filteredLeaveRequests || []).filter(
        (req) => req.leave_type_id === entry.leaveType.id
      ),
    }));
  }, [leaveRequestsByType, filteredLeaveRequests]);

  // Calculate totals for filtered data
  const filteredTotals = useMemo(() => {
    const total = filteredLeaveRequests?.length || 0;
    const paidApprovedDays = (filteredLeaveRequests || []).reduce((sum, r) => {
      if (r.status === 'approved' && r.leave_type?.is_paid) {
        return (
          sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day)
        );
      }
      return sum;
    }, 0);
    const unpaidApprovedDays = (filteredLeaveRequests || []).reduce((sum, r) => {
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
  }, [filteredLeaveRequests]);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Leave Requests Management</h1>
          <p className='text-muted-foreground'>
            Manage and approve leave requests from all users
          </p>
          <div className='mt-2 flex items-center gap-2 text-sm'>
            <span className='text-muted-foreground'>Active filters:</span>
            <Badge variant='secondary'>Year: {appliedYear}</Badge>
            {appliedEmployee ? (
              <Badge variant='secondary'>
                Employee: {appliedEmployee.full_name || appliedEmployee.email}
              </Badge>
            ) : null}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <FilterDrawer
            usersWithUsage={usersWithUsage}
            selectedYear={selectedYear}
            selectedUserId={selectedUserId}
          />
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats allLeaveRequests={filteredLeaveRequests} totals={filteredTotals} />

      {/* Usage Overview */}
      <UsageOverview allLeaveRequests={filteredLeaveRequests} totals={filteredTotals} />

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
              selectedYear={appliedYear}
              all={filteredLeaveRequests || []}
              leaveRequestsByType={filteredLeaveRequestsByType}
            />
          </TabsContent>

          <TabsContent value='users' className='space-y-4'>
            <ListUser
              usersWithUsage={filteredUsersForTab}
              selectedYear={appliedYear}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminLeaveRequestsPageClient;
