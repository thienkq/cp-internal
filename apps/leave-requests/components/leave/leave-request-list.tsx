"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Calendar, Clock, User, FileText, AlertCircle } from "lucide-react";
import { LeaveRequest } from "@/types";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";
import { getStatusBadge, formatDateRange, getDurationText } from "@/lib/leave-request-display-utils";

interface LeaveRequestListProps {
  leaveRequests: LeaveRequest[];
  title: string;
  showUserColumn?: boolean;
  showActions?: boolean;
  onApprove?: (request: LeaveRequest) => void;
  onReject?: (request: LeaveRequest) => void;
  onCancel?: (request: LeaveRequest) => void;
}

export function LeaveRequestList({
  leaveRequests,
  title,
  showUserColumn = false,
  showActions = false,
  onApprove,
  onReject,
  onCancel,
}: LeaveRequestListProps) {
  const [requests, setRequests] = useState(leaveRequests);

  const handleActionComplete = () => {
    // This will trigger a re-render and the parent component should refresh the data
    // For now, we'll just remove the request from the local state
    // In a real app, you'd want to refresh the data from the server
    window.location.reload();
  };

  if (leaveRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leave requests found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {title}
          <Badge variant="outline" className="ml-2">
            {leaveRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {leaveRequests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {showUserColumn && request.user && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{request.user.full_name}</span>
                        <span className="text-gray-400">({request.user.email})</span>
                      </div>
                    )}
                    
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Calendar className="h-4 w-4" />
                      {formatDateRange(request.start_date, request.end_date, request.is_half_day, request.half_day_type)}
                    </div>
                    
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="h-4 w-4" />
                      {getDurationText(request.start_date, request.end_date, request.is_half_day)}
                    </div>

                    {request.leave_type && (
                      <Badge variant="outline" className="text-xs">
                        {request.leave_type.name}
                      </Badge>
                    )}
                  </div>

                  {request.message && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Reason:</span> {request.message}
                    </div>
                  )}

                  {request.projects && request.projects.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Projects:</span>{" "}
                      {request.projects.map((p) => p.name).join(", ")}
                    </div>
                  )}

                  {request.status === "approved" && request.approved_by && (
                    <div className="text-sm text-green-600">
                      <span className="font-medium">Approved by:</span> {request.approved_by.full_name}
                    </div>
                  )}

                  {request.status === "rejected" && request.approval_notes && (
                    <div className="text-sm text-red-600">
                      <span className="font-medium">Rejection reason:</span> {request.approval_notes}
                    </div>
                  )}

                  {request.status === "canceled" && request.cancel_reason && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Cancel reason:</span> {request.cancel_reason}
                    </div>
                  )}
                </div>

                {showActions && request.status === "pending" && (
                  <div className="ml-4">
                    <LeaveRequestActions 
                      request={request} 
                      onActionComplete={handleActionComplete}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 