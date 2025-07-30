import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { Card } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"
import { PageContainer } from "@workspace/ui/components/page-container"
import BirthdayWrapper from "@/components/birthday-wrapper";
import BirthdayBanner from "@/components/birthday-banner";
import { isBirthdayToday } from "@/lib/birthday-utils";
import type { User } from "@/types";

// Mock data for other stats
const leaveBalance = 12
const upcomingHolidays = 2
const pendingRequests = 1;
const teamOnLeave = 2
const recentRequests = [
  { id: 1, type: "Annual Leave", days: 2, start: "23/07/2025", end: "24/07/2025", status: "approved" },
  { id: 2, type: "Sick Leave", days: 1, start: "10/07/2025", end: "10/07/2025", status: "pending" },
]

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

  const userName = userData.full_name || user.email || "User";
  const isBirthday = isBirthdayToday(userData.date_of_birth);

  return (
    <PageContainer>
      {/* Birthday Celebration Modal */}
      <BirthdayWrapper userName={userName} isBirthday={isBirthday} />

      {/* Greeting and Congratulatory Banners */}
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
        {isBirthday && (
          <BirthdayBanner 
            userName={userName} 
            dateOfBirth={userData.date_of_birth}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-600">{leaveBalance}</div>
          <div className="text-sm text-gray-500">Leave Balance</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-green-600">{upcomingHolidays}</div>
          <div className="text-sm text-gray-500">Upcoming Holidays</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-600">{pendingRequests}</div>
          <div className="text-sm text-gray-500">Pending Requests</div>
        </Card>
        <Card className="p-6 text-center">
          <div className="text-3xl font-bold text-orange-600">{teamOnLeave}</div>
          <div className="text-sm text-gray-500">Team on Leave Today</div>
        </Card>
      </div>

      {/* Recent Leave Requests */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Recent Leave Requests</h2>
          <a href="/dashboard/leave/history" className="text-blue-600 text-sm hover:underline">View All</a>
        </div>
        <Card className="divide-y">
          {recentRequests.map((req) => (
            <div key={req.id} className="flex items-center justify-between p-4">
              <div>
                <div className="font-medium">{req.type} ({req.days} day{req.days > 1 ? "s" : ""})</div>
                <div className="text-xs text-gray-500">{req.start} - {req.end}</div>
              </div>
              <div>
                <Badge variant={
                  req.status === "approved"
                    ? "green"
                    : req.status === "pending"
                    ? "yellow"
                    : "secondary"
                }>
                  {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                </Badge>
              </div>
            </div>
          ))}
          {recentRequests.length === 0 && (
            <div className="p-4 text-center text-gray-400">No recent leave requests.</div>
          )}
        </Card>
      </div>
    </PageContainer>
  )
}
