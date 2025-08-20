import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { calculateLeaveBalance } from "@/lib/leave-quota-utils";
import { getUserBonusLeaveSummary } from "@/lib/bonus-leave-utils";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";

interface LeaveBalanceSectionProps {
  userId: string;
}

export async function LeaveBalanceSection({ userId }: LeaveBalanceSectionProps) {
  // Calculate complete leave balance using new utilities
  const leaveBalance = await calculateLeaveBalance(userId);
  
  // Get bonus leave for current year
  const currentYear = new Date().getFullYear();
  const bonusLeave = await getUserBonusLeaveSummary(userId, currentYear);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
      {/* Total Quota */}
      <Card className="p-6 text-center relative">
        <div className="text-3xl font-bold text-blue-600">{leaveBalance.totalQuota}</div>
        <div className="text-sm text-gray-500">Total Quota</div>
        <div className="text-gray-400 mt-1">
          {leaveBalance.isOnboardingYear ? 'Onboarding Year' : `Year ${leaveBalance.employmentYear}`}
          {leaveBalance.isOnboardingYear && ' (Prorated)'}
        </div>
        <Link href="/dashboard/leave-balance-details">
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-6 px-2 text-muted-foreground hover:text-foreground">
            View Details <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </Card>

      {/* Bonus Leave */}
      <Card className="p-6 text-center relative">
        <div className="flex items-center justify-center mb-2">
          <Gift className="w-5 h-5 text-purple-600 mr-2" />
        </div>
        {bonusLeave ? (
          <>
            <div className="text-3xl font-bold text-purple-600">{bonusLeave.total_granted}</div>
            <div className="text-sm text-gray-500">Bonus Leave</div>
          </>
        ) : (
          <>
            <div className="text-3xl font-bold text-gray-400">0</div>
            <div className="text-sm text-gray-500">Bonus Leave</div>
            <div className="text-gray-400 mt-1">None granted this year</div>
          </>
        )}
      </Card>

      {/* Used + Pending Days */}
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-red-600">{leaveBalance.usedDays + leaveBalance.pendingDays}</div>
        <div className="text-sm text-gray-500">Committed</div>
        <div className="text-gray-400 mt-1">
          {leaveBalance.usedDays} used + {leaveBalance.pendingDays} pending
        </div>
      </Card>

      {/* Remaining Days */}
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-green-600">{leaveBalance.remainingDays}</div>
        <div className="text-sm text-gray-500">Available</div>
        <div className="text-gray-400 mt-1">Free to request</div>
      </Card>



    </div>
  );
} 