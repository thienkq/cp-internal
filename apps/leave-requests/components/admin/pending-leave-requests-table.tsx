"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table";
import { Calendar, Clock, User, FileText, AlertCircle, Eye } from "lucide-react";
import { LeaveRequest } from "@/types";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";
import { getStatusBadge, formatDateRange, getDurationText } from "@/lib/leave-request-display-utils";

interface PendingLeaveRequestsTableProps {
  leaveRequests: LeaveRequest[];
  onActionComplete?: () => void;
}

export function PendingLeaveRequestsTable({
  leaveRequests,
  onActionComplete,
}: PendingLeaveRequestsTableProps) {

  const handleActionComplete = () => {
    // Remove the request from local state after action
    // In a real app, you'd want to refresh the data from the server
    if (onActionComplete) {
      onActionComplete();
    } else {
      window.location.reload();
    }
  };

  if (leaveRequests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pending Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>No pending leave requests found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Pending Leave Requests
          <Badge variant="outline" className="ml-2">
            {leaveRequests.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Employee</TableHead>
                <TableHead className="w-[150px]">Leave Type</TableHead>
                <TableHead className="w-[200px]">Date Range</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[200px]">Projects</TableHead>
                <TableHead className="w-[200px]">Reason</TableHead>
                <TableHead className="w-[150px]">Submitted</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">
                          {request.user?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {request.user?.email || 'No email'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {request.leave_type ? (
                      <Badge variant="outline" className="text-xs">
                        {request.leave_type.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">No type</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {formatDateRange(request.start_date, request.end_date, request.is_half_day, request.half_day_type)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {getDurationText(request.start_date, request.end_date, request.is_half_day)}
                      </span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {request.projects && request.projects.length > 0 ? (
                      <div className="space-y-1">
                        {request.projects.map((project) => (
                          <Badge key={project.id} variant="secondary" className="text-xs">
                            {project.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No projects</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {request.message ? (
                      <div className="max-w-[180px]">
                        <p className="text-sm text-foreground truncate" title={request.message}>
                          {request.message}
                        </p>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No reason</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-foreground">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LeaveRequestActions 
                        request={request} 
                        onActionComplete={handleActionComplete}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
} 