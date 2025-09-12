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
import { getDb } from '@/db';
import { users, leaveRequests, leaveTypes } from '@/db/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

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
  const { user } = await getCurrentUser();
  const db = getDb();

  const userId = user?.id as string;

  const currentYear = new Date().getFullYear();

  // 🎯 PARALLEL EXECUTION: Only 2 queries needed
  const [userData, displayLeaveRequests] = await Promise.all([
    db
      .select({
        id: users.id,
        full_name: users.full_name,
        email: users.email,
        date_of_birth: users.date_of_birth,
        start_date: users.start_date,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then((result) => {
        const user = result?.[0];

        return user || null;
      })
      .catch((error) => {
        console.error('Error fetching user data:', error);
        return null;
      }),
    db
      .select({
        id: leaveRequests.id,
          user_id: leaveRequests.user_id,
        leave_type_id: leaveRequests.leave_type_id,
        start_date: leaveRequests.start_date,
        end_date: leaveRequests.end_date,
        status: leaveRequests.status,
        is_half_day: leaveRequests.is_half_day,
        half_day_type: leaveRequests.half_day_type,
        message: leaveRequests.message,
        created_at: leaveRequests.created_at,
        updated_at: leaveRequests.updated_at,
        leave_type: {
          name: leaveTypes.name,
          description: leaveTypes.description,
        },
        approved_by: {
          full_name: users.full_name,
        },
      })
      .from(leaveRequests)
      .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
      .leftJoin(users, eq(leaveRequests.approved_by_id, users.id))
      .where(
        and(
          eq(leaveRequests.user_id, userId),
          gte(leaveRequests.start_date, `${currentYear}-01-01`),
          lte(leaveRequests.start_date, `${currentYear}-12-31`)
        )
      )
      .orderBy(desc(leaveRequests.created_at))
      .limit(10)
      .then((result) => result)
      .catch((error) => {
        console.error('Error fetching leave requests:', error);
        return [];
      }),
  ]);

  return {
    user: user as User,
    userData,
    displayLeaveRequests: displayLeaveRequests || [],
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
