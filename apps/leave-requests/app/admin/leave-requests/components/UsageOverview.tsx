'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import { Layers } from 'lucide-react';
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
    <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
      <CardHeader className='pb-1'>
        <CardTitle className='text-base flex items-center gap-2'>
          <Layers className='w-3 h-3' />
          Usage Overview
        </CardTitle>
      </CardHeader>
      <CardContent className='pt-0 pb-1'>
        <div className='space-y-1'>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-1.5'>
              <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
              <span className='text-xs text-muted-foreground'>Paid Days Used</span>
            </div>
            <span className='text-xs font-semibold text-blue-600'>{totals.paidApprovedDays}</span>
          </div>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-1.5'>
              <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
              <span className='text-xs text-muted-foreground'>Unpaid Days Used</span>
            </div>
            <span className='text-xs font-semibold text-purple-600'>{totals.unpaidApprovedDays}</span>
          </div>
          <div className='flex justify-between items-center'>
            <div className='flex items-center gap-1.5'>
              <div className='w-1.5 h-1.5 bg-orange-500 rounded-full'></div>
              <span className='text-xs text-muted-foreground'>Pending Requests</span>
            </div>
            <span className='text-xs font-semibold text-orange-600'>{getStatusCount(allLeaveRequests, 'pending')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UsageOverview;
