'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { getStatusCount } from '@/lib/utils';
import { LeaveRequest } from '@/types';

const UsageOverview = ({
  allLeaveRequests,
  totals,
}: {
  allLeaveRequests: LeaveRequest[];
  totals: { paidApprovedDays: number; unpaidApprovedDays: number };
}) => {
  return (
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
  );
};

export default UsageOverview;
