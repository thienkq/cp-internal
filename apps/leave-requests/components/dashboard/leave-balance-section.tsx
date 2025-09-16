'use client';

import { Card } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useDashboardContext } from '../member/dashboard/context';

export function LeaveBalanceSection() {
  const { leaveBalance, bonusLeave } = useDashboardContext();

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4'>
      {/* Total Quota */}
      <Card className='p-6 text-center relative'>
        <div className='text-3xl font-bold text-primary'>
          {leaveBalance?.totalQuota}
        </div>
        <div className='text-sm text-muted-foreground'>Total Quota</div>
        <div className='text-muted-foreground/70 mt-1'>
          {leaveBalance?.isOnboardingYear
            ? 'Onboarding Year'
            : `Year ${leaveBalance?.employmentYear}`}
          {leaveBalance?.isOnboardingYear && ' (Prorated)'}
        </div>
        <Link href='/dashboard/leave-balance-details'>
          <Button
            variant='ghost'
            size='sm'
            className='absolute top-2 right-2 h-6 px-2 text-muted-foreground hover:text-foreground'
          >
            View Details <ArrowRight className='w-3 h-3 ml-1' />
          </Button>
        </Link>
      </Card>

      {/* Bonus Leave */}
      <Card className='p-6 text-center relative'>
        {bonusLeave ? (
          <>
            <div className='text-3xl font-bold text-purple-600'>
              {bonusLeave?.total_granted || 0}
            </div>
            <div className='text-sm text-muted-foreground'>Bonus Leave</div>
          </>
        ) : (
          <>
            <div className='text-3xl font-bold text-muted-foreground/70'>0</div>
            <div className='text-sm text-muted-foreground'>Bonus Leave</div>
            <div className='text-muted-foreground/70 mt-1'>None granted this year</div>
          </>
        )}
      </Card>

      {/* Used + Pending Days */}
      <Card className='p-6 text-center'>
        <div className='text-3xl font-bold text-destructive'>
          {(leaveBalance?.usedDays || 0) + (leaveBalance?.pendingDays || 0)}
        </div>
        <div className='text-sm text-muted-foreground'>Committed</div>
        <div className='text-muted-foreground/70 mt-1'>
          {leaveBalance?.usedDays || 0} approved +{' '}
          {leaveBalance?.pendingDays || 0} pending
        </div>
      </Card>

      {/* Remaining Days */}
      <Card className='p-6 text-center'>
        <div className='text-3xl font-bold text-green-600'>
          {leaveBalance?.remainingDays || 0}
        </div>
        <div className='text-sm text-muted-foreground'>Available</div>
        <div className='text-muted-foreground/70 mt-1'>Free to request</div>
      </Card>
    </div>
  );
}
