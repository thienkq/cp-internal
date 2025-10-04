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
    <div className='space-y-4'>
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

      {/* Leave Balances */}
      <div className='space-y-4'>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Main Stats - 2 columns on large screens */}
          <div className='lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-3'>
          {/* Total Quota Card */}
          <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
            <CardHeader className='pb-1'>
              <div className='flex items-center justify-between'>
                <div className='p-1 bg-primary/10 rounded-md'>
                  <Calendar className='w-3 h-3 text-primary' />
                </div>
                <Badge 
                  variant={leaveBalance?.isOnboardingYear ? 'yellow' : 'blue'}
                  className='text-xs px-1.5 py-0.5'
                >
                  {leaveBalance?.isOnboardingYear ? 'Prorated' : `Year ${leaveBalance?.employmentYear}`}
                </Badge>
              </div>
              <CardTitle className='text-xl font-bold text-primary'>
                {totalQuota}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>Total Quota</p>
            </CardHeader>
          </Card>

          {/* Available Days Card */}
          <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
            <CardHeader className='pb-1'>
              <div className='flex items-center justify-between'>
                <div className='p-1 bg-green-100 dark:bg-green-900/20 rounded-md'>
                  <CheckCircle className='w-3 h-3 text-green-600' />
                </div>
                <div className='flex items-center gap-1 text-green-600'>
                  <span className='text-xs font-medium'>Available</span>
                </div>
              </div>
              <CardTitle className='text-xl font-bold text-green-600'>
                {remainingDays}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>Days Available</p>
            </CardHeader>
          </Card>

          {/* Committed Days Card */}
          <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
            <CardHeader className='pb-1'>
              <div className='flex items-center justify-between'>
                <div className='p-1 bg-orange-100 dark:bg-orange-900/20 rounded-md'>
                  <Clock className='w-3 h-3 text-orange-600' />
                </div>
                <div className='flex items-center gap-1 text-orange-600'>
                  <span className='text-xs font-medium'>Submitted</span>
                </div>
              </div>
              <CardTitle className='text-xl font-bold text-orange-600'>
                {committedDays}
              </CardTitle>
              <div className='flex items-center justify-between'>
                <p className='text-xs text-muted-foreground'>Days Submitted</p>
                <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                  <span>{usedDays} approved</span>
                  <span>•</span>
                  <span>{pendingDays} pending</span>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Bonus Leave Card */}
          <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
            <CardHeader className='pb-1'>
              <div className='flex items-center justify-between'>
                <div className='p-1 bg-purple-100 dark:bg-purple-900/20 rounded-md'>
                  <Gift className='w-3 h-3 text-purple-600' />
                </div>
                <Badge 
                  variant={bonusLeave?.total_granted ? 'green' : 'outline'}
                  className='text-xs px-1.5 py-0.5'
                >
                  {bonusLeave?.total_granted ? 'Active' : 'None'}
                </Badge>
              </div>
              <CardTitle className='text-xl font-bold text-purple-600'>
                {bonusLeave?.total_granted || 0}
              </CardTitle>
              <p className='text-xs text-muted-foreground'>Bonus Leave</p>
            </CardHeader>
          </Card>
          </div>

          {/* Integrated Usage Overview - 1 column on large screens */}
          <Card className='lg:col-span-1'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base flex items-center gap-2'>
                <TrendingUp className='w-3 h-3' />
                Usage Overview
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
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

              {/* Compact Breakdown */}
              <div className='space-y-2'>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-green-500 rounded-full'></div>
                    <span className='text-xs text-muted-foreground'>Available</span>
                  </div>
                  <span className='text-xs font-semibold text-green-600'>{remainingDays}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-blue-500 rounded-full'></div>
                    <span className='text-xs text-muted-foreground'>Approved</span>
                  </div>
                  <span className='text-xs font-semibold text-blue-600'>{usedDays}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-orange-500 rounded-full'></div>
                    <span className='text-xs text-muted-foreground'>Pending</span>
                  </div>
                  <span className='text-xs font-semibold text-orange-600'>{pendingDays}</span>
                </div>
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-1.5'>
                    <div className='w-1.5 h-1.5 bg-purple-500 rounded-full'></div>
                    <span className='text-xs text-muted-foreground'>Unpaid</span>
                  </div>
                  <span className='text-xs font-semibold text-purple-600'>{unpaidUsedDays || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
