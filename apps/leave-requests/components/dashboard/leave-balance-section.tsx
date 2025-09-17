'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Button } from '@workspace/ui/components/button';
import { Badge } from '@workspace/ui/components/badge';
import Link from 'next/link';
import { 
  ArrowRight, 
  Calendar, 
  Gift, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useDashboardContext } from '../member/dashboard/context';

export function LeaveBalanceSection() {
  const { leaveBalance, bonusLeave, unpaidUsedDays } = useDashboardContext();

  // Calculate usage percentage for visual indicators
  const totalQuota = leaveBalance?.totalQuota || 0;
  const usedDays = leaveBalance?.usedDays || 0;
  const pendingDays = leaveBalance?.pendingDays || 0;
  const committedDays = usedDays + pendingDays;
  const remainingDays = leaveBalance?.remainingDays || 0;
  const usagePercentage = totalQuota > 0 ? (committedDays / totalQuota) * 100 : 0;

  return (
    <div className='space-y-6'>
      {/* Section Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold text-foreground'>Leave Balance</h2>
          <p className='text-muted-foreground'>
            Your time off overview for {new Date().getFullYear()}
          </p>
        </div>
        <Link href='/dashboard/leave-balance-details'>
          <Button variant='outline' size='sm' className='gap-2'>
            View Details <ArrowRight className='w-4 h-4' />
          </Button>
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {/* Total Quota Card */}
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-primary/10 rounded-lg'>
                <Calendar className='w-5 h-5 text-primary' />
              </div>
              <Badge 
                variant={leaveBalance?.isOnboardingYear ? 'yellow' : 'blue'}
                className='text-xs'
              >
                {leaveBalance?.isOnboardingYear ? 'Prorated' : `Year ${leaveBalance?.employmentYear}`}
              </Badge>
            </div>
            <CardTitle className='text-3xl font-bold text-primary'>
              {totalQuota}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Total Quota</p>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-xs text-muted-foreground'>
              {leaveBalance?.isOnboardingYear
                ? 'Onboarding year allocation'
                : `Employment year ${leaveBalance?.employmentYear}`}
            </div>
          </CardContent>
        </Card>

        {/* Available Days Card */}
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                <CheckCircle className='w-5 h-5 text-green-600' />
              </div>
              <div className='flex items-center gap-1 text-green-600'>
                <TrendingUp className='w-4 h-4' />
                <span className='text-xs font-medium'>Available</span>
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-green-600'>
              {remainingDays}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Days Available</p>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-xs text-muted-foreground'>
              Ready to request
            </div>
          </CardContent>
        </Card>

        {/* Committed Days Card */}
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg'>
                <Clock className='w-5 h-5 text-orange-600' />
              </div>
              <div className='flex items-center gap-1 text-orange-600'>
                <TrendingDown className='w-4 h-4' />
                <span className='text-xs font-medium'>Committed</span>
              </div>
            </div>
            <CardTitle className='text-3xl font-bold text-orange-600'>
              {committedDays}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Days Committed</p>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='flex items-center gap-2 text-xs text-muted-foreground'>
              <span>{usedDays} approved</span>
              <Minus className='w-3 h-3' />
              <span>{pendingDays} pending</span>
            </div>
          </CardContent>
        </Card>

        {/* Bonus Leave Card */}
        <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <div className='p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
                <Gift className='w-5 h-5 text-purple-600' />
              </div>
              <Badge 
                variant={bonusLeave?.total_granted ? 'green' : 'outline'}
                className='text-xs'
              >
                {bonusLeave?.total_granted ? 'Active' : 'None'}
              </Badge>
            </div>
            <CardTitle className='text-3xl font-bold text-purple-600'>
              {bonusLeave?.total_granted || 0}
            </CardTitle>
            <p className='text-sm text-muted-foreground'>Bonus Leave</p>
          </CardHeader>
          <CardContent className='pt-0'>
            <div className='text-xs text-muted-foreground'>
              {bonusLeave?.total_granted 
                ? 'Additional days granted' 
                : 'No bonus leave this year'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Usage Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Progress Bar */}
            <div className='space-y-2'>
              <div className='flex justify-between text-sm'>
                <span className='text-muted-foreground'>Days Used</span>
                <span className='font-medium'>{usagePercentage.toFixed(1)}%</span>
              </div>
              <div className='w-full bg-muted rounded-full h-2'>
                <div 
                  className='bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-300'
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* Breakdown */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4 pt-2'>
              <div className='text-center'>
                <div className='text-lg font-semibold text-green-600'>{remainingDays}</div>
                <div className='text-sm font-medium text-muted-foreground'>Available</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-blue-600'>{usedDays}</div>
                <div className='text-sm font-medium text-muted-foreground'>Approved</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-orange-600'>{pendingDays}</div>
                <div className='text-sm font-medium text-muted-foreground'>Pending</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-purple-600'>{unpaidUsedDays || 0}</div>
                <div className='text-sm font-medium text-muted-foreground'>Unpaid</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
