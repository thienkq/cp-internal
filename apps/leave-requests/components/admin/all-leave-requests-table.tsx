"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@workspace/ui/components/table";
import { Calendar, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { LeaveRequest } from "@/types";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";
import { getStatusBadge, formatDateRange, getDurationText } from "@/lib/leave-request-display-utils";

interface AllLeaveRequestsTableProps {
  leaveRequests: LeaveRequest[];
  title: string;
  showActions?: boolean;
  onActionComplete?: () => void;
}

export function AllLeaveRequestsTable({
  leaveRequests,
  title,
  showActions = false,
  onActionComplete,
}: AllLeaveRequestsTableProps) {
  const [requests, setRequests] = useState(leaveRequests);

  const handleActionComplete = () => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'canceled':
        return <MinusCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

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
              <TableRow>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead className="w-[200px]">Employee</TableHead>
                <TableHead className="w-[150px]">Leave Type</TableHead>
                <TableHead className="w-[200px]">Date Range</TableHead>
                <TableHead className="w-[100px]">Duration</TableHead>
                <TableHead className="w-[200px]">Projects</TableHead>
                <TableHead className="w-[200px]">Reason</TableHead>
                <TableHead className="w-[150px]">Submitted</TableHead>
                <TableHead className="w-[150px]">Processed</TableHead>
                {showActions && <TableHead className="w-[120px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(request.status)}
                      {getStatusBadge(request.status)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.user?.full_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
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
                      <span className="text-gray-400 text-sm">No type</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      {formatDateRange(request.start_date, request.end_date, request.is_half_day, request.half_day_type)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-500" />
                      {getDurationText(request.start_date, request.end_date, request.is_half_day)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {request.projects && request.projects.length > 0 ? (
                      <div className="space-y-1 flex flex-wrap gap-1">
                        {request.projects.map((project) => (
                          <Badge key={project.id} variant="secondary" className="text-xs">
                            {project.name}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No projects</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {request.message ? (
                      <div className="max-w-[180px]">
                        <p className="text-sm text-gray-700 truncate" title={request.message}>
                          {request.message}
                        </p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No reason</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {request.status === 'approved' && request.approved_at ? (
                      <div className="text-sm text-green-600">
                        <div className="font-medium">Approved</div>
                        <div className="text-xs">
                          {new Date(request.approved_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        {request.approved_by && (
                          <div className="text-xs text-gray-500">
                            by {request.approved_by.full_name}
                          </div>
                        )}
                      </div>
                    ) : request.status === 'rejected' ? (
                      <div className="text-sm text-red-600">
                        <div className="font-medium">Rejected</div>
                        {request.approval_notes && (
                          <div className="text-xs text-gray-500 truncate" title={request.approval_notes}>
                            {request.approval_notes}
                          </div>
                        )}
                      </div>
                    ) : request.status === 'canceled' ? (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">Canceled</div>
                        {request.cancel_reason && (
                          <div className="text-xs text-gray-500 truncate" title={request.cancel_reason}>
                            {request.cancel_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  
                  {showActions && (
                    <TableCell>
                      {request.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <LeaveRequestActions 
                            request={request} 
                            onActionComplete={handleActionComplete}
                          />
                        </div>
                      )}
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