import { Suspense } from 'react';
import { getCurrentUser, User } from '@workspace/supabase';
import { PageContainer } from '@workspace/ui/components/page-container';
import { DashboardSkeleton } from '@/components/skeletons';
import DashboardPageClient from './page.client';
import { getUserBonusLeaveSummary } from '@/lib/bonus-leave-utils';
import {
  getAnniversaryInfo,
  isWorkAnniversaryToday,
} from '@/lib/anniversary-utils';
import { calculateLeaveBalance } from '@/lib/leave-quota-utils';
import { DashboardProvider } from '@/components/member/dashboard/context';

// TODO: Dashboard Performance !
// Based on: https://blog.logrocket.com/fix-nextjs-app-slow-performance/
//
// Technique 1: Parallel Data Fetching (Promise.all)
//
// Technique 2: React Suspense with Progressive Loading
// - Fast content shows immediately
// - Heavy components load separately with skeletons
// - Better perceived performance
//

// 🚀 OPTIMIZED PARALLEL DATA FETCHING
async function getDashboardData() {
  const { user, supabase } = await getCurrentUser();

  const userId = user?.id as string;

  const currentYear = new Date().getFullYear();

  // 🎯 PARALLEL EXECUTION: Only 2 queries needed
  const [userData, displayLeaveRequests] = await Promise.all([
    // Query 1: Essential user data (fast)
    supabase
      .from('users')
      .select('id, full_name, email, date_of_birth, start_date')
      .eq('id', userId)
      .single(),

    // Query 2: Leave requests with joins for display in lists only show the last 10 requests
    supabase
      .from('leave_requests')
      .select(
        `
        id,
        user_id,
        leave_type_id,
        start_date,
        end_date,
        status,
        is_half_day,
        half_day_type,
        message,
        created_at,
        updated_at,
        leave_type:leave_types(name, description),
        approved_by:users!leave_requests_approved_by_id_fkey(full_name)
      `
      )
      .eq('user_id', userId)
      .gte('start_date', `${currentYear}-01-01`)
      .lte('start_date', `${currentYear}-12-31`)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  return {
    user: user as User,
    userData: userData.data,
    displayLeaveRequests: displayLeaveRequests.data || [],
  };
}

// 🚀 MAIN HYBRID DASHBOARD COMPONENT
// Combines: Parallel Data Fetching + React Suspense
export default async function DashboardPage() {
  const { user, userData, displayLeaveRequests } = await getDashboardData();

  if (!userData) {
    return (
      <PageContainer>
        <div className='text-red-600'>Failed to load user data.</div>
      </PageContainer>
    );
  }
  const userId = user?.id as string;
  const userName = userData.full_name || user.email || 'User';
  const currentYear = new Date().getFullYear();
  const bonusLeave = await getUserBonusLeaveSummary(user.id, currentYear);
  const leaveBalance = await calculateLeaveBalance(userId);
  const isAnniversary = userData.start_date
    ? await isWorkAnniversaryToday(userData.start_date, user.id)
    : false;
  const anniversaryInfo = userData.start_date
    ? await getAnniversaryInfo(userData.start_date, user.id)
    : null;

  return (
    <PageContainer>
      {/* 🎯 SUSPENSE: Shows skeleton while parallel data loads */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardProvider
          user={user}
          userName={userName}
          userData={userData}
          displayLeaveRequests={displayLeaveRequests}
          leaveBalance={leaveBalance}
          bonusLeave={bonusLeave}
          isAnniversary={isAnniversary}
          anniversaryInfo={anniversaryInfo}
        >
          <DashboardPageClient />
        </DashboardProvider>
      </Suspense>
    </PageContainer>
  );
}
