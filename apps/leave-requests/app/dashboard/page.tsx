import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container"
import { AnniversarySection } from "@/components/dashboard/anniversary-section";
import { LeaveBalanceSection } from "@/components/dashboard/leave-balance-section";
import { LeaveRequestsSection } from "@/components/dashboard/leave-requests-section"
import { 
  DashboardSkeleton, 
  LeaveBalanceSkeleton 
} from "@/components/skeletons";

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
  
  if (!user) {
    redirect("/auth/login");
  }

  const currentYear = new Date().getFullYear();

  // 🎯 PARALLEL EXECUTION: Only 2 queries needed
  const [userData, displayLeaveRequests] = await Promise.all([
    // Query 1: Essential user data (fast)
    supabase
      .from("users")
      .select("id, full_name, email, date_of_birth, start_date")
      .eq("id", user.id)
      .single(),
    
    // Query 2: Leave requests with joins for display in lists only show the last 10 requests
    supabase
      .from("leave_requests")
      .select(`
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
      `)
      .eq("user_id", user.id)
      .gte("start_date", `${currentYear}-01-01`)
      .lte("start_date", `${currentYear}-12-31`)
      .order("created_at", { ascending: false })
      .limit(10)
  ]);

  return {
    user,
    userData: userData.data,
    displayLeaveRequests: displayLeaveRequests.data || []
  };
}

// 🎯 FAST DASHBOARD CONTENT (Parallel data already loaded)
async function DashboardContent() {
  const { user, userData, displayLeaveRequests } = await getDashboardData();

  if (!userData) {
    return (
      <PageContainer>
        <div className="text-red-600">Failed to load user data.</div>
      </PageContainer>
    );
  }

  const userName = userData.full_name || user.email || "User";

  return (
    <>
      {/* 🚀 IMMEDIATE: User Greeting + Pending Badge */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/leave-requests" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View All Leave Requests →
            </Link>
          </div>
        </div>
        
        {/* ⚠️ Start Date Reminder Banner */}
        {!userData.start_date && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="text-yellow-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-yellow-800">
                <p className="font-medium">Start Date Not Set</p>
                <p className="text-sm">Your leave balance is currently set to the default rate. 
                <Link href="/dashboard/profile" className="text-yellow-700 underline ml-1 hover:text-yellow-800">Set your start date</Link> to get the correct leave balance based on your tenure.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎉 Anniversary Section - Data already loaded from parallel fetch */}
      <AnniversarySection
        userName={userName}
        dateOfBirth={userData.date_of_birth}
        startDate={userData.start_date}
        userId={user.id}
      />

      {/* ⚡ SUSPENSE: Leave Balance Section - Heavy calculation loads separately */}
      <Suspense fallback={<LeaveBalanceSkeleton />}>
        <LeaveBalanceSection userId={user.id} />
      </Suspense>

      {/* 📋 Leave Requests Section - Data already loaded from parallel fetch show the last 10 requests*/}
      <LeaveRequestsSection leaveRequests={displayLeaveRequests as any} />
    </>
  );
}

// 🚀 MAIN HYBRID DASHBOARD COMPONENT
// Combines: Parallel Data Fetching + React Suspense
export default async function DashboardPage() {
  return (
    <PageContainer>
      {/* 🎯 SUSPENSE: Shows skeleton while parallel data loads */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageContainer>
  );
}