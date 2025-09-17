"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { Calendar, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, Minus } from "lucide-react";
import { LeaveRequest } from "@/types";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";
import { UserLeaveRequestActions } from "@/components/leave/user-leave-request-actions";
import { getStatusBadge, formatDateRange, getDurationText } from "@/lib/leave-request-display-utils";

interface LeaveRequestListProps {
  leaveRequests: LeaveRequest[];
  title: string;
  showUserColumn?: boolean;
  showActions?: boolean;
  showUserActions?: boolean;
  isManagerView?: boolean;
  onApprove?: (request: LeaveRequest) => void;
  onReject?: (request: LeaveRequest) => void;
  onCancel?: (request: LeaveRequest) => void;
}

// Helper function to determine if a request counts toward used leave
function countsTowardUsedLeave(status: string): boolean {
  return status === "approved" || status === "pending";
}

// Helper function to get leave impact indicator
function getLeaveImpactIndicator(status: string) {
  if (status === "approved") {
    return (
      <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-3 w-3" />
        <span className="text-xs font-medium">Approved</span>
      </div>
    );
  } else if (status === "pending") {
    return (
      <div className="flex items-center gap-1 text-orange-600">
        <Clock className="h-3 w-3" />
        <span className="text-xs font-medium">Pending (reserved)</span>
      </div>
    );
  } else if (status === "rejected") {
    return (
      <div className="flex items-center gap-1 text-red-500">
        <XCircle className="h-3 w-3" />
        <span className="text-xs font-medium">Excluded Requests</span>
      </div>
    );
  } else if (status === "canceled") {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Minus className="h-3 w-3" />
        <span className="text-xs font-medium">Excluded Requests</span>
      </div>
    );
  }
  return null;
}

export function LeaveRequestList({
  leaveRequests,
  title,
  showUserColumn = false,
  showActions = false,
  showUserActions = false,
  isManagerView = false,
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

  // Filter requests by category
  const countedRequests = leaveRequests.filter(req => countsTowardUsedLeave(req.status));
  const notCountedRequests = leaveRequests.filter(req => !countsTowardUsedLeave(req.status));

  // Helper function to render request items
  const renderRequestItem = (request: LeaveRequest) => (
    <div key={request.id} className="p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            {showUserColumn && request.user && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="font-medium">{request.user.full_name}</span>
                <span className="text-muted-foreground/70">({request.user.email})</span>
              </div>
            )}
            
            {getStatusBadge(request.status)}
            {getLeaveImpactIndicator(request.status)}
          </div>

          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {formatDateRange(request.start_date, request.end_date, request.is_half_day, request.half_day_type)}
            </div>
            
            <div className="flex items-center gap-1 text-muted-foreground">
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
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Reason:</span> {request.message}
            </div>
          )}

          {request.projects && request.projects.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Projects:</span>{" "}
              {request.projects.map((p) => p.name).join(", ")}
            </div>
          )}

          {request.emergency_contact && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Emergency Contact:</span> {request.emergency_contact}
            </div>
          )}

          {request.current_manager && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Manager:</span> {request.current_manager.full_name}
              <span className="text-muted-foreground/70 ml-1">({request.current_manager.email})</span>
            </div>
          )}

          {request.backup_person && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Backup Person:</span> {request.backup_person.full_name}
              <span className="text-muted-foreground/70 ml-1">({request.backup_person.email})</span>
            </div>
          )}

          {request.external_notifications && request.external_notifications.length > 0 && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">External Notifications:</span>
              <div className="ml-4 flex flex-wrap gap-1 mt-1">
                {request.external_notifications.map((email, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {email}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground/70 mt-2">
            <span className="font-medium">Created:</span> {new Date(request.created_at).toLocaleString()}
            {request.updated_at !== request.created_at && (
              <span className="ml-3">
                <span className="font-medium">Updated:</span> {new Date(request.updated_at).toLocaleString()}
              </span>
            )}
          </div>

          {request.status === "approved" && request.approved_by && (
            <div className="text-sm text-green-600">
              <span className="font-medium">Approved by:</span> {request.approved_by.full_name}
              {request.approved_at && (
                <span className="text-muted-foreground ml-2">
                  on {new Date(request.approved_at).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {request.status === "rejected" && request.approval_notes && (
            <div className="text-sm text-destructive">
              <span className="font-medium">Rejection reason:</span> {request.approval_notes}
            </div>
          )}

          {request.status === "canceled" && (
            <div className="text-sm text-muted-foreground">
              {request.cancel_reason && (
                <>
                  <span className="font-medium">Cancel reason:</span> {request.cancel_reason}
                </>
              )}
              {request.canceled_at && (
                <div className="text-xs text-muted-foreground/70 mt-1">
                  <span className="font-medium">Canceled at:</span> {new Date(request.canceled_at).toLocaleString()}
                </div>
              )}
            </div>
          )}
        </div>

        {showActions && request.status === "pending" && (
          <div className="ml-4">
            <LeaveRequestActions 
              request={request} 
              onActionComplete={handleActionComplete}
              isManagerView={isManagerView}
            />
          </div>
        )}
        
        {showUserActions && (
          <div className="ml-4">
            <UserLeaveRequestActions 
              request={request} 
              onActionComplete={handleActionComplete}
            />
          </div>
        )}
      </div>
    </div>
  );

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
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
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
        <Tabs defaultValue="counted" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mx-4 mt-4">
            <TabsTrigger value="counted" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Used/Reserved ({countedRequests.length})
            </TabsTrigger>
            <TabsTrigger value="not-counted" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Total Excluded Requests ({notCountedRequests.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="counted" className="mt-0">
            <div className="px-4 pb-2 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              </div>
            </div>
            {countedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No approved or pending leave requests</p>
              </div>
            ) : (
              <div className="divide-y">
                {countedRequests.map(renderRequestItem)}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="not-counted" className="mt-0">
            <div className="px-4 pb-2 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <XCircle className="h-4 w-4" />
                <span>These requests do not affect your leave balance</span>
              </div>
            </div>
            {notCountedRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <XCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p>No rejected or cancelled leave requests</p>
              </div>
            ) : (
              <div className="divide-y">
                {notCountedRequests.map(renderRequestItem)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 