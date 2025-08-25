import { LeaveRequestList } from "@/components/leave/leave-request-list";
import type { LeaveRequest } from "@/types";

interface LeaveRequestsSectionProps {
  leaveRequests: LeaveRequest[];
}

export function LeaveRequestsSection({ leaveRequests }: LeaveRequestsSectionProps) {
  return (
    <div className="space-y-4 pt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Leave Requests</h2>
        <div className="flex items-center gap-2">
          <a href="/dashboard/leave/new" className="text-blue-600 text-sm hover:underline">New Request</a>
        </div>
      </div>
      
      <LeaveRequestList
        leaveRequests={leaveRequests}
        title="Recent Leave Requests"
        showUserColumn={false}
        showActions={false}
        showUserActions={true}
      />
    </div>
  );
} 