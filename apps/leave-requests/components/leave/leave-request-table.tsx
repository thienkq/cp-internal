"use client";

import { useCallback, useMemo, useState } from "react";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Calendar, FileText, User, Eye, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
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

  type SortKey = "dates" | "duration" | "submitted";
  const [sortKey, setSortKey] = useState<SortKey>("submitted");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  function handleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDirection("asc");
    }
  }

  const toTime = useCallback((value?: string | null): number => {
    return value ? new Date(value).getTime() : 0;
  }, []);

  const computeDurationDays = useCallback((request: LeaveRequest): number => {
    if (request.is_half_day) return 0.5;
    const start = toTime(request.start_date);
    const end = toTime(request.end_date ?? request.start_date);
    if (!start || !end) return 0;
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = Math.max(0, Math.round((end - start) / msPerDay)) + 1;
    return diff;
  }, [toTime]);

  const sortedLeaveRequests = useMemo(() => {
    const arrayCopy = [...leaveRequests];
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    arrayCopy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "dates") {
        cmp = toTime(a.start_date) - toTime(b.start_date);
      } else if (sortKey === "duration") {
        cmp = computeDurationDays(a) - computeDurationDays(b);
      } else if (sortKey === "submitted") {
        const aSubmitted = toTime(a.created_at ?? a.start_date);
        const bSubmitted = toTime(b.created_at ?? b.start_date);
        cmp = aSubmitted - bSubmitted;
      }
      if (cmp === 0) {
        // Stable fallback: sort by id if available
        const aId = typeof a.id === "string" ? a.id : String(a.id ?? "");
        const bId = typeof b.id === "string" ? b.id : String(b.id ?? "");
        cmp = aId.localeCompare(bId);
      }
      return cmp * directionFactor;
    });
    return arrayCopy;
  }, [leaveRequests, sortKey, sortDirection, computeDurationDays, toTime]);

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="h-4 w-4" />;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  }

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
                <TableHead className="font-semibold">
                  <button onClick={() => handleSort("dates")} className="flex items-center gap-1">
                    Dates
                    <SortIcon column="dates" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">
                  <button onClick={() => handleSort("duration")} className="flex items-center gap-1">
                    Duration
                    <SortIcon column="duration" />
                  </button>
                </TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Reason</TableHead>
                <TableHead className="font-semibold">
                  <button onClick={() => handleSort("submitted")} className="flex items-center gap-1">
                    Submitted
                    <SortIcon column="submitted" />
                  </button>
                </TableHead>
                {(showActions || showUserActions) && (
                  <TableHead className="font-semibold">Actions</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeaveRequests.map((request) => (
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