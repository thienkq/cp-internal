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
  );
};

export default QuickStats;
