'use client';

import React from 'react';
import { Card } from '@workspace/ui/components/card';
import { AllLeaveRequestsTable } from '@/components/admin/all-leave-requests-table';
import { Button } from '@workspace/ui/components/button';
import { Filter, Download } from 'lucide-react';
import { LeaveRequest } from '@/types';

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
}: {
  allLeaveRequests: LeaveRequest[];
}) => {
  const getStatusCount = (status: string) => {
    return allLeaveRequests?.filter((req) => req.status === status).length || 0;
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
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-purple-600'>
            {getStatusCount('pending')}
          </div>
          <div className='text-sm text-muted-foreground'>Pending</div>
          <div className='text-xs text-muted-foreground/70 mt-1'>
            Awaiting approval
          </div>
        </Card>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-green-600'>
            {getStatusCount('approved')}
          </div>
          <div className='text-sm text-muted-foreground'>Approved</div>
          <div className='text-xs text-muted-foreground/70 mt-1'>
            This period
          </div>
        </Card>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-destructive'>
            {getStatusCount('rejected')}
          </div>
          <div className='text-sm text-muted-foreground'>Rejected</div>
          <div className='text-xs text-muted-foreground/70 mt-1'>
            This period
          </div>
        </Card>
        <Card className='p-6 text-center'>
          <div className='text-3xl font-bold text-muted-foreground'>
            {getStatusCount('canceled')}
          </div>
          <div className='text-sm text-muted-foreground'>Canceled</div>
          <div className='text-xs text-muted-foreground/70 mt-1'>
            This period
          </div>
        </Card>
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
