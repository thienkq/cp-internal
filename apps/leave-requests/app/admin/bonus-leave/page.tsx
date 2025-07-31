import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Gift, Users, Calendar, TrendingUp } from "lucide-react";
import BonusLeaveForm from "@/components/admin/bonus-leave-form";
import BonusLeaveList from "@/components/admin/bonus-leave-list";
import { getAllBonusLeaveGrantsServer } from "@/lib/bonus-leave-server-utils";

export default async function BonusLeavePage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Check if user is admin
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userProfile?.role !== "admin") {
    redirect("/dashboard");
  }

  // Get current year bonus leave summary
  const currentYear = new Date().getFullYear();
  const bonusLeaves = await getAllBonusLeaveGrantsServer(currentYear);
  
  // Calculate summary statistics
  const totalGranted = bonusLeaves.reduce((sum, item) => sum + item.total_granted, 0);
  const totalUsed = bonusLeaves.reduce((sum, item) => sum + item.total_used, 0);
  const totalRemaining = bonusLeaves.reduce((sum, item) => sum + item.remaining, 0);
  const activeUsers = bonusLeaves.filter(item => item.remaining > 0).length;

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Bonus Leave Management</h1>
          <p className="text-gray-600">Grant and manage bonus leave days for employees</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Gift className="h-4 w-4 text-green-600" />
                Total Granted
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalGranted}</div>
              <div className="text-xs text-gray-500">days this year</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Total Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsed}</div>
              <div className="text-xs text-gray-500">days used</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-purple-600" />
                Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{totalRemaining}</div>
              <div className="text-xs text-gray-500">days available</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Users className="h-4 w-4 text-orange-600" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{activeUsers}</div>
              <div className="text-xs text-gray-500">with bonus leave</div>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="flex justify-end">
          <BonusLeaveForm 
            currentUser={{ id: user.id, full_name: user.user_metadata?.full_name || "Admin" }}
          />
        </div>

        {/* Bonus Leave List */}
        <BonusLeaveList 
          currentUser={{ id: user.id, full_name: user.user_metadata?.full_name || "Admin" }}
        />

        {/* Information Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Gift className="h-5 w-5" />
              About Bonus Leave
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <div className="space-y-2 text-sm">
              <p>• <strong>Multiple Grants:</strong> You can grant multiple bonus leave periods to the same employee in the same year</p>
              <p>• <strong>Carryover:</strong> Bonus leave follows the same carryover rules as annual leave</p>
              <p>• <strong>Priority:</strong> Bonus leave is used before annual leave when employees request time off</p>
              <p>• <strong>Audit Trail:</strong> Each grant is tracked with reason and admin who granted it</p>
              <p>• <strong>Flexibility:</strong> You can delete individual grants if needed</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
} 