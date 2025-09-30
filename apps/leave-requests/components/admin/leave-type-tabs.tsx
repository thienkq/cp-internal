'use client';

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import { LeaveRequestsTable } from '@/components/admin/leave-requests-table';
import type { LeaveRequest as LeaveRequestType } from '@/types';
import { useEffect, useState } from 'react';
import { LeaveType } from '@/types/leave-request';

interface LeaveTypeTabsProps {
  selectedTab: string;
  selectedYear: number;
  all: LeaveRequestType[];
  leaveRequestsByType: {
    leaveType: LeaveType;
    leaveRequests: LeaveRequestType[];
  }[];
}

export function LeaveTypeTabs({
  selectedTab,
  selectedYear,
  all,
  leaveRequestsByType,
}: LeaveTypeTabsProps) {
  const [currentTab, setCurrentTab] = useState(selectedTab || 'all');

  useEffect(() => {
    setCurrentTab(selectedTab || 'all');
  }, [selectedTab]);

  const onChangeTab = (v: string) => {
    setCurrentTab(v);
  };

  const counts = {
    all: all.length,
  };

  return (
    <Tabs value={currentTab} onValueChange={onChangeTab} className='w-full'>
      <TabsList className='flex w-full gap-2 overflow-x-auto whitespace-nowrap'>
        <TabsTrigger value='all' className='cursor-pointer shrink-0'>All ({counts.all})</TabsTrigger>
        {leaveRequestsByType.map((lt) => (
          <TabsTrigger key={lt.leaveType.id} value={lt.leaveType.name} className='cursor-pointer shrink-0'>
            {lt.leaveType.name} ({lt.leaveRequests.length})
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent
        value='all'
        className='min-h-[320px] max-h-[70vh] overflow-x-hidden overflow-y-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300'
      >
        <LeaveRequestsTable
          leaveRequests={all}
          title={`${selectedYear} Time Off History`}
          showActions={true}
          emptyMessage={`You haven't submitted any time off requests for ${selectedYear} yet.`}
        />
      </TabsContent>
      {leaveRequestsByType.map((lt) => (
        <TabsContent
          key={lt.leaveType.id}
          value={lt.leaveType.name}
          className='min-h-[320px] max-h-[70vh] overflow-x-hidden overflow-y-auto data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300'
        >
          <LeaveRequestsTable
            leaveRequests={lt.leaveRequests}
            title={lt.leaveType.name}
            showActions={true}
            emptyMessage={`No ${lt.leaveType.name} leave requests found.`}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
