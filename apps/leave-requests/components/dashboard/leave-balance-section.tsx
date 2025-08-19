import { Card } from "@workspace/ui/components/card";
import { calculateEffectiveTenure } from "@/lib/anniversary-utils";

interface LeaveBalanceSectionProps {
  startDate?: string;
  userId: string;
  pendingRequestsCount: number;
}

export async function LeaveBalanceSection({ 
  startDate, 
  userId, 
  pendingRequestsCount 
}: LeaveBalanceSectionProps) {
  // Calculate real leave balance based on tenure
  // If no start_date is set, default to 0 years (new employee rate of 12 days)
  const effectiveTenure = startDate 
    ? await calculateEffectiveTenure(startDate, userId)
    : { years: 0, months: 0, days: 0 };
  
  const getLeaveBalance = (years: number): number => {
    if (years < 1) return 12;
    if (years < 2) return 13;
    if (years < 3) return 15;
    if (years < 4) return 18;
    return 22;
  };
  
  const leaveBalance = getLeaveBalance(effectiveTenure.years);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-blue-600">{leaveBalance}</div>
        <div className="text-sm text-gray-500">Leave Balance</div>
        <div className="text-xs text-gray-400 mt-1">
          {!startDate 
            ? 'Start date not set' 
            : effectiveTenure.years > 0 
              ? `${effectiveTenure.years} year${effectiveTenure.years > 1 ? 's' : ''} of service` 
              : 'New employee'
          }
        </div>
      </Card>
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-green-600">0</div>
        <div className="text-sm text-gray-500">Days Used</div>
        <div className="text-xs text-gray-400 mt-1">This year</div>
      </Card>
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-orange-600">{leaveBalance}</div>
        <div className="text-sm text-gray-500">Remaining</div>
        <div className="text-xs text-gray-400 mt-1">This year</div>
      </Card>
      <Card className="p-6 text-center">
        <div className="text-3xl font-bold text-purple-600">{pendingRequestsCount}</div>
        <div className="text-sm text-gray-500">Pending</div>
        <div className="text-xs text-gray-400 mt-1">Awaiting approval</div>
      </Card>
    </div>
  );
} 