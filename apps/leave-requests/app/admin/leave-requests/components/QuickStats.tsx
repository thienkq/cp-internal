'use client';

import React from 'react';
import { Card, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Layers, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { getStatusCount } from '@/lib/utils';
import { LeaveRequest } from '@/types';

const QuickStats = ({
  allLeaveRequests,
  totals,
}: {
  allLeaveRequests: LeaveRequest[];
  totals: {
    total: number;
    paidApprovedDays: number;
    unpaidApprovedDays: number;
  };
}) => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
        <CardHeader className='pb-1'>
          <div className='flex items-center justify-between'>
            <div className='p-1 bg-primary/10 rounded-md'>
              <Layers className='w-3 h-3 text-primary' />
            </div>
          </div>
          <CardTitle className='text-xl font-bold text-primary'>
            {totals.total}
          </CardTitle>
          <p className='text-xs text-muted-foreground'>Total Requests</p>
        </CardHeader>
      </Card>
      <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
        <CardHeader className='pb-1'>
          <div className='flex items-center justify-between'>
            <div className='p-1 bg-orange-100 dark:bg-orange-900/20 rounded-md'>
              <Clock className='w-3 h-3 text-orange-600' />
            </div>
          </div>
          <CardTitle className='text-xl font-bold text-orange-600'>
            {getStatusCount(allLeaveRequests, 'pending')}
          </CardTitle>
          <p className='text-xs text-muted-foreground'>Pending</p>
        </CardHeader>
      </Card>
      <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
        <CardHeader className='pb-1'>
          <div className='flex items-center justify-between'>
            <div className='p-1 bg-green-100 dark:bg-green-900/20 rounded-md'>
              <CheckCircle2 className='w-3 h-3 text-green-600' />
            </div>
          </div>
          <CardTitle className='text-xl font-bold text-green-600'>
            {getStatusCount(allLeaveRequests, 'approved')}
          </CardTitle>
          <p className='text-xs text-muted-foreground'>Approved</p>
        </CardHeader>
      </Card>
      <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
        <CardHeader className='pb-1'>
          <div className='flex items-center justify-between'>
            <div className='p-1 bg-red-100 dark:bg-red-900/20 rounded-md'>
              <XCircle className='w-3 h-3 text-red-600' />
            </div>
          </div>
          <CardTitle className='text-xl font-bold text-red-600'>
            {getStatusCount(allLeaveRequests, 'rejected')}
          </CardTitle>
          <p className='text-xs text-muted-foreground'>Rejected</p>
        </CardHeader>
      </Card>
    </div>
  );
};

export default QuickStats;
