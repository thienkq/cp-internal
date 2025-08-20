import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { calculateLeaveBalance } from "@/lib/leave-quota-utils";
import Link from "next/link";
import { MoreHorizontal, ArrowRight } from "lucide-react";

interface LeaveBalanceSectionProps {
  userId: string;
}

export async function LeaveBalanceSection({ userId }: LeaveBalanceSectionProps) {
  // Calculate complete leave balance using new utilities
  const leaveBalance = await calculateLeaveBalance(userId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
      {/* Total Quota */}
      <Card className="p-6 text-center relative">
        <div className="text-3xl font-bold text-blue-600">{leaveBalance.totalQuota}</div>
        <div className="text-sm text-gray-500">Total Quota</div>
        <div className="text-xs text-gray-400 mt-1">
          {leaveBalance.isOnboardingYear ? 'Onboarding Year' : `Year ${leaveBalance.employmentYear}`}
          {leaveBalance.isOnboardingYear && ' (Prorated)'}
        </div>
        <Link href="/dashboard/leave-balance-details">
          <Button variant="ghost" size="sm" className="absolute top-2 right-2 text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
            View Details <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </Card>

      {/* Days Used */}
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-green-600">{leaveBalance.usedDays}</div>
        <div className="text-sm text-gray-500">Days Used</div>
        <div className="text-xs text-gray-400 mt-1">This year</div>
      </Card>

      {/* Remaining Days */}
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-orange-600">{leaveBalance.remainingDays}</div>
        <div className="text-sm text-gray-500">Remaining</div>
        <div className="text-xs text-gray-400 mt-1">Available to use</div>
      </Card>

      {/* Pending Days */}
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-purple-600">{leaveBalance.pendingDays}</div>
        <div className="text-sm text-gray-500">Pending</div>
        <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
      </Card>
    </div>
  );
} 