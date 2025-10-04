'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { AnniversarySection } from '@/components/dashboard/anniversary-section';
import { LeaveBalanceSection } from '@/components/dashboard/leave-balance-section';
import { LeaveRequestsSection } from '@/components/dashboard/leave-requests-section';
import { LeaveBalanceSkeleton } from '@/components/skeletons';
import { useDashboardContext } from '@/components/member/dashboard/context';

const DashboardPageClient = () => {
  const {
    userName,
    userData,
    displayLeaveRequests,
  } = useDashboardContext();

  return (
    <>
      {/* 🚀 IMMEDIATE: User Greeting + Pending Badge */}
      <div className='space-y-4'>

        {/* ⚠️ Start Date Reminder Banner */}
        {!userData.start_date && (
          <div className='bg-muted border border-border rounded-lg p-4 mb-4'>
            <div className='flex items-center gap-2'>
              <div className='text-yellow-600 dark:text-yellow-400'>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                    clipRule='evenodd'
                  />
                </svg>
              </div>
              <div className='text-foreground'>
                <p className='font-medium'>Missing Start Date</p>
                <p className='text-sm text-muted-foreground'>
                  Your time off balance is currently calculated using default settings.
                  <Link
                    href='/dashboard/profile'
                    className='text-primary underline ml-1 hover:text-primary/80'
                  >
                    Add your start date
                  </Link>{' '}
                  to get the correct time off balance based on how long you&apos;ve been with the company.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎉 Anniversary Section - Data already loaded from parallel fetch */}
      <AnniversarySection />

      {/* ⚡ SUSPENSE: Leave Balance Section - Heavy calculation loads separately */}
      <Suspense fallback={<LeaveBalanceSkeleton />}>
        <LeaveBalanceSection />
      </Suspense>

      {/* 📋 Recent Time Off Requests Section - Data already loaded from parallel fetch show the last 10 requests*/}
      <LeaveRequestsSection leaveRequests={displayLeaveRequests} />
    </>
  );
};

export default DashboardPageClient;
