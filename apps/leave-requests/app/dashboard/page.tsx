import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { PageContainer } from "@workspace/ui/components/page-container"
import BirthdayWrapper from "@/components/birthday-wrapper";
import BirthdayBanner from "@/components/birthday-banner";
import AnniversaryWrapper from "@/components/anniversary-wrapper";
import WorkAnniversaryBanner from "@/components/work-anniversary-banner";
import { LeaveRequestList } from "@/components/leave/leave-request-list";
import { isBirthdayToday } from "@/lib/birthday-utils";
import { isWorkAnniversaryToday, getAnniversaryInfo, calculateEffectiveTenure } from "@/lib/anniversary-utils";
import type { User, LeaveRequest } from "@/types";

export default async function DashboardPage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user data including date_of_birth
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData) {
    return (
      <PageContainer>
        <div className="text-red-600">Failed to load user data.</div>
      </PageContainer>
    );
  }

  // Calculate real leave balance based on tenure
  // If no start_date is set, default to 0 years (new employee rate of 12 days)
  const effectiveTenure = userData.start_date 
    ? await calculateEffectiveTenure(userData.start_date, userData.id)
    : { years: 0, months: 0, days: 0 };
  
  const getLeaveBalance = (years: number): number => {
    if (years < 1) return 12;
    if (years < 2) return 13;
    if (years < 3) return 15;
    if (years < 4) return 18;
    return 22;
  };
  const leaveBalance = getLeaveBalance(effectiveTenure.years);

  // Fetch real pending leave requests
  const { data: pendingRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "pending");

  // Fetch real recent leave requests with joins
  const { data: recentRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!approved_by_id(full_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch all user's leave requests for the leave requests section
  const { data: allUserRequests } = await supabase
    .from("leave_requests")
    .select(`
      *,
      leave_type:leave_types(name, description),
      projects,
      approved_by:users!approved_by_id(full_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Calculate current year's leave usage
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1).toISOString();
  const endOfYear = new Date(currentYear, 11, 31).toISOString();
  
  const { data: currentYearRequests } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_date", startOfYear)
    .lte("start_date", endOfYear)
    .eq("status", "approved");

  const getCurrentYearDaysUsed = () => {
    if (!currentYearRequests) return 0;
    
    return currentYearRequests.reduce((total, req) => {
      if (req.is_half_day) {
        return total + 0.5;
      }
      if (req.end_date && req.start_date !== req.end_date) {
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return total + diffDays;
      }
      return total + 1;
    }, 0);
  };

  const currentYearDaysUsed = getCurrentYearDaysUsed();
  const remainingLeave = leaveBalance - currentYearDaysUsed;

  const userName = userData.full_name || user.email || "User";
  const isBirthday = isBirthdayToday(userData.date_of_birth);
  const isAnniversary = userData.start_date 
    ? await isWorkAnniversaryToday(userData.start_date, userData.id)
    : false;
  const anniversaryInfo = userData.start_date 
    ? await getAnniversaryInfo(userData.start_date, userData.id)
    : null;

  return (
    <PageContainer>
      {/* Birthday Celebration Modal */}
      <BirthdayWrapper userName={userName} isBirthday={isBirthday} />

      {/* Work Anniversary Celebration Modal */}
      <AnniversaryWrapper 
        userName={userName} 
        years={anniversaryInfo?.years || 0}
        isAnniversary={isAnniversary} 
      />

      {/* Greeting and Congratulatory Banners */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
          <a 
            href="/dashboard/leave-requests" 
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            View All Leave Requests →
          </a>
        </div>
        
        {/* Start Date Reminder Banner */}
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
                <a href="/dashboard/profile" className="text-yellow-700 underline ml-1">Set your start date</a> to get the correct leave balance based on your tenure.</p>
              </div>
            </div>
          </div>
        )}
        
        {isBirthday && (
          <BirthdayBanner 
            userName={userName} 
            dateOfBirth={userData.date_of_birth}
          />
        )}
        {isAnniversary && anniversaryInfo && userData.start_date && (
          <WorkAnniversaryBanner 
            userName={userName} 
            years={anniversaryInfo.years}
            startDate={userData.start_date}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{leaveBalance}</div>
          <div className="text-sm text-gray-500">Leave Balance</div>
          <div className="text-xs text-gray-400 mt-1">
            {!userData.start_date 
              ? 'Start date not set' 
              : effectiveTenure.years > 0 
                ? `${effectiveTenure.years} year${effectiveTenure.years > 1 ? 's' : ''} of service` 
                : 'New employee'
            }
          </div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{currentYearDaysUsed}</div>
          <div className="text-sm text-gray-500">Days Used</div>
          <div className="text-xs text-gray-400 mt-1">This year</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{remainingLeave.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Remaining</div>
          <div className="text-xs text-gray-400 mt-1">This year</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{pendingRequests?.length || 0}</div>
          <div className="text-sm text-gray-500">Pending</div>
          <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
        </Card>
      </div>

      {/* My Leave Requests */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">My Leave Requests</h2>
          <div className="flex items-center gap-2">
            <a href="/dashboard/leave-requests" className="text-blue-600 text-sm hover:underline">View All</a>
            <a href="/dashboard/leave/new" className="text-blue-600 text-sm hover:underline">New Request</a>
          </div>
        </div>
        
        <LeaveRequestList
          leaveRequests={recentRequests || []}
          title="Recent Leave Requests"
          showUserColumn={false}
          showActions={false}
        />
      </div>
    </PageContainer>
  )
}
