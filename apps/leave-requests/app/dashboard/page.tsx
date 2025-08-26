import { Suspense } from "react";
import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container"
import { AnniversarySection } from "@/components/dashboard/anniversary-section";
import { LeaveBalanceSection } from "@/components/dashboard/leave-balance-section";
import { LeaveRequestsSection } from "@/components/dashboard/leave-requests-section";

// TODO: Dashboard Performance !
// Based on: https://blog.logrocket.com/fix-nextjs-app-slow-performance/
//
// Technique 1: Parallel Data Fetching (Promise.all)
// - 3 sequential queries = 600ms → 3 parallel queries = 200ms (3x faster!)
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

  // 🎯 PARALLEL EXECUTION: All queries run simultaneously
  const [userData, pendingRequests, recentRequests] = await Promise.all([
    // Query 1: Essential user data (fast)
    supabase
      .from("users")
      .select("id, full_name, email, date_of_birth, start_date")
      .eq("id", user.id)
      .single(),
    
    // Query 2: Lightweight pending count (fast)
    supabase
      .from("leave_requests")
      .select("id, start_date, status")
      .eq("user_id", user.id)
      .eq("status", "pending"),
    
    // Query 3: Recent requests with optimized joins (medium)
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
      .limit(5)
  ]);

  return {
    user,
    userData: userData.data,
    pendingRequests: pendingRequests.data || [],
    recentRequests: recentRequests.data || []
  };
}

// 🎯 FAST DASHBOARD CONTENT (Parallel data already loaded)
async function DashboardContent() {
  const { user, userData, pendingRequests, recentRequests } = await getDashboardData();

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
            {pendingRequests.length > 0 && (
              <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full font-medium">
                {pendingRequests.length} pending request{pendingRequests.length !== 1 ? 's' : ''}
              </span>
            )}
            <a 
              href="/dashboard/leave-requests" 
              className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
            >
              View All Leave Requests →
            </a>
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
                <a href="/dashboard/profile" className="text-yellow-700 underline ml-1 hover:text-yellow-800">Set your start date</a> to get the correct leave balance based on your tenure.</p>
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

      {/* 📋 Leave Requests Section - Data already loaded from parallel fetch */}
      <LeaveRequestsSection leaveRequests={recentRequests} />
    </>
  );
}

// 🎨 ENHANCED SKELETON COMPONENTS
function DashboardSkeleton() {
  return (
    <>
      {/* Greeting skeleton */}
      <div className="space-y-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="h-5 bg-gray-200 rounded w-40"></div>
        </div>
      </div>

      {/* Anniversary skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-5 bg-gray-200 rounded w-48"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>

      {/* Leave balance skeleton */}
      <LeaveBalanceSkeleton />

      {/* Leave requests skeleton */}
      <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function LeaveBalanceSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-gray-200 rounded w-32"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 🚀 MAIN HYBRID DASHBOARD COMPONENT
// Combines: Parallel Data Fetching + React Suspense
export default async function HybridDashboardPage() {
  return (
    <PageContainer>
      {/* 🎯 SUSPENSE: Shows skeleton while parallel data loads */}
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageContainer>
  );
}