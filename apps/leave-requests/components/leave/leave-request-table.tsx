"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Calendar, FileText, User, Eye } from "lucide-react";
import { LeaveRequest } from "@/types";
import { getStatusBadge, formatDateRange, getDurationText, formatDate } from "@/lib/leave-request-display-utils";
import { UserLeaveRequestActions } from "@/components/leave/user-leave-request-actions";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";

interface LeaveRequestTableProps {
  leaveRequests: LeaveRequest[];
  title: string;
  showUserColumn?: boolean;
  showActions?: boolean;
  showUserActions?: boolean;
  isManagerView?: boolean;
  emptyMessage?: string;
}

export function LeaveRequestTable({
  leaveRequests,
  title,
  showUserColumn = false,
  showActions = false,
  showUserActions = false,
  isManagerView = false,
  emptyMessage = "No leave requests found"
}: LeaveRequestTableProps) {

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
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground mb-2">No Leave Requests</p>
            <p>{emptyMessage}</p>
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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                {showUserColumn && (
                  <TableHead className="font-semibold">Employee</TableHead>
                )}
                <TableHead className="font-semibold">Leave Type</TableHead>
                <TableHead className="font-semibold">Dates</TableHead>
                <TableHead className="font-semibold">Duration</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Reason</TableHead>
                <TableHead className="font-semibold">Submitted</TableHead>
                {(showActions || showUserActions) && (
                  <TableHead className="font-semibold">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  {showUserColumn && (
                    <TableCell>
                      {request.user ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{request.user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{request.user.email}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  
                  <TableCell>
                    {request.leave_type ? (
                      <Badge variant="outline" className="text-xs">
                        {request.leave_type.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {formatDateRange(request.start_date, request.end_date, request.is_half_day, request.half_day_type)}
                  </TableCell>
                  
                  <TableCell className="text-sm font-medium">
                    {getDurationText(request.start_date, request.end_date, request.is_half_day)}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(request.status)}
                      {request.status === "approved" && request.approved_by && (
                        <div className="text-xs text-muted-foreground">
                          by {request.approved_by.full_name}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="max-w-xs">
                    <div className="space-y-1">
                      {request.message ? (
                        <div className="text-sm text-foreground truncate" title={request.message}>
                          {request.message}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                      
                      {request.projects && request.projects.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Projects: {request.projects.map((p) => p.name).join(", ")}
                        </div>
                      )}
                      
                      {request.status === "rejected" && request.approval_notes && (
                        <div className="text-xs text-destructive">
                          Reason: {request.approval_notes}
                        </div>
                      )}
                      
                      {request.status === "canceled" && request.cancel_reason && (
                        <div className="text-xs text-muted-foreground">
                          Canceled: {request.cancel_reason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  
                  <TableCell className="text-sm text-muted-foreground">
                      {formatDate(request.created_at || request.start_date)}
                    </TableCell>
                  
                  {showActions && (
                    <TableCell>
                      {request.status === "pending" ? (
                        <LeaveRequestActions 
                          request={request} 
                          onActionComplete={() => window.location.reload()}
                          isManagerView={isManagerView}
                        />
                      ) : (
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      )}
                    </TableCell>
                  )}
                  
                  {showUserActions && (
                    <TableCell>
                      <UserLeaveRequestActions 
                        request={request} 
                        onActionComplete={() => window.location.reload()}
                      />
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}