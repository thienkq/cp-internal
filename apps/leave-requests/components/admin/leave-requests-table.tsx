"use client";

import { useCallback, useMemo, useState } from "react";
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
import { Calendar, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, MinusCircle, ArrowUpDown, ChevronUp, ChevronDown, Eye } from "lucide-react";
import { LeaveRequest } from "@/types";
import { LeaveRequestActions } from "@/components/admin/leave-request-actions";
import { getStatusBadge, formatDateRange, getDurationText } from "@/lib/leave-request-display-utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";

interface LeaveRequestsTableProps {
  leaveRequests: LeaveRequest[];
  title: string;
  showActions?: boolean;
  onActionComplete?: () => void;
  emptyMessage?: string;
}

export function LeaveRequestsTable({
  leaveRequests,
  title,
  showActions = false,
  onActionComplete,
  emptyMessage = "No leave requests found"
}: LeaveRequestsTableProps) {

  type SortKey = "status" | "employee" | "leaveType" | "dates" | "duration" | "submitted";
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

  function getStatusWeight(status: string | null | undefined): number {
    const order: Record<string, number> = {
      pending: 1,
      approved: 2,
      rejected: 3,
      canceled: 4,
    };
    if (!status) return Number.MAX_SAFE_INTEGER;
    return order[status] ?? Number.MAX_SAFE_INTEGER - 1;
  }

  const sortedLeaveRequests = useMemo(() => {
    const arrayCopy = [...leaveRequests];
    const directionFactor = sortDirection === "asc" ? 1 : -1;
    arrayCopy.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "status") {
        cmp = getStatusWeight(a.status) - getStatusWeight(b.status);
      } else if (sortKey === "employee") {
        const aName = a.user?.full_name?.toLowerCase() ?? "";
        const bName = b.user?.full_name?.toLowerCase() ?? "";
        cmp = aName.localeCompare(bName);
      } else if (sortKey === "leaveType") {
        const aType = a.leave_type?.name?.toLowerCase() ?? "";
        const bType = b.leave_type?.name?.toLowerCase() ?? "";
        cmp = aType.localeCompare(bType);
      } else if (sortKey === "dates") {
        cmp = toTime(a.start_date) - toTime(b.start_date);
      } else if (sortKey === "duration") {
        cmp = computeDurationDays(a) - computeDurationDays(b);
      } else if (sortKey === "submitted") {
        const aSubmitted = toTime(a.created_at ?? a.start_date);
        const bSubmitted = toTime(b.created_at ?? b.start_date);
        cmp = aSubmitted - bSubmitted;
      }
      if (cmp === 0) {
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

  const handleActionComplete = () => {
    if (onActionComplete) {
      onActionComplete();
    } else {
      window.location.reload();
    }
  };

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRequest, setDetailRequest] = useState<LeaveRequest | null>(null);

  const openDetails = (req: LeaveRequest) => {
    setDetailRequest(req);
    setDetailOpen(true);
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
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium text-foreground mb-2">No Leave Requests</p>
            <p>{emptyMessage}</p>
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
    <>
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
                <TableHead className="w-[140px]">
                  <button onClick={() => handleSort("status")} className="flex items-center gap-1">
                    Status
                    <SortIcon column="status" />
                  </button>
                </TableHead>
                <TableHead className="w-[220px]">
                  <button onClick={() => handleSort("employee")} className="flex items-center gap-1">
                    Employee
                    <SortIcon column="employee" />
                  </button>
                </TableHead>
                <TableHead className="w-[170px]">
                  <button onClick={() => handleSort("leaveType")} className="flex items-center gap-1">
                    Leave Type
                    <SortIcon column="leaveType" />
                  </button>
                </TableHead>
                <TableHead className="w-[220px]">
                  <button onClick={() => handleSort("dates")} className="flex items-center gap-1">
                    Date Range
                    <SortIcon column="dates" />
                  </button>
                </TableHead>
                <TableHead className="w-[120px]">
                  <button onClick={() => handleSort("duration")} className="flex items-center gap-1">
                    Duration
                    <SortIcon column="duration" />
                  </button>
                </TableHead>
                <TableHead className="w-[200px]">Reason</TableHead>
                <TableHead className="w-[170px]">
                  <button onClick={() => handleSort("submitted")} className="flex items-center gap-1">
                    Submitted
                    <SortIcon column="submitted" />
                  </button>
                </TableHead>
                <TableHead className="w-[150px]">Processed</TableHead>
                {showActions && <TableHead className="w-[140px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeaveRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
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
                          <div className="text-xs text-muted-foreground">
                            by {request.approved_by.full_name}
                          </div>
                        )}
                      </div>
                    ) : request.status === 'rejected' ? (
                      <div className="text-sm text-red-600">
                        <div className="font-medium">Rejected</div>
                        {request.approval_notes && (
                          <div className="text-xs text-muted-foreground truncate" title={request.approval_notes}>
                            {request.approval_notes}
                          </div>
                        )}
                      </div>
                    ) : request.status === 'canceled' ? (
                      <div className="text-sm text-gray-600">
                        <div className="font-medium">Canceled</div>
                        {request.cancel_reason && (
                          <div className="text-xs text-muted-foreground truncate" title={request.cancel_reason}>
                            {request.cancel_reason}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  
                  {showActions && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:underline"
                          onClick={() => openDetails(request)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {request.status === "pending" && (
                          <LeaveRequestActions 
                            request={request} 
                            onActionComplete={handleActionComplete}
                          />
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
    <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Leave Request Details</DialogTitle>
        </DialogHeader>
        {detailRequest && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Employee</div>
                <div className="text-muted-foreground">
                  {detailRequest.user?.full_name} ({detailRequest.user?.email})
                </div>
              </div>
              <div>
                <div className="font-medium">Leave Type</div>
                <div className="text-muted-foreground">{detailRequest.leave_type?.name}</div>
              </div>
              <div>
                <div className="font-medium">Dates</div>
                <div className="text-muted-foreground">
                  {formatDateRange(detailRequest.start_date, detailRequest.end_date, detailRequest.is_half_day, detailRequest.half_day_type)}
                </div>
              </div>
              <div>
                <div className="font-medium">Duration</div>
                <div className="text-muted-foreground">{getDurationText(detailRequest.start_date, detailRequest.end_date, detailRequest.is_half_day)}</div>
              </div>
              <div>
                <div className="font-medium">Status</div>
                <div className="mt-1">{getStatusBadge(detailRequest.status)}</div>
              </div>
              <div>
                <div className="font-medium">Submitted</div>
                <div className="text-muted-foreground">{new Date(detailRequest.created_at).toLocaleString()}</div>
              </div>
              {detailRequest.approved_at && (
                <div>
                  <div className="font-medium">Approved</div>
                  <div className="text-muted-foreground">{new Date(detailRequest.approved_at).toLocaleString()}</div>
                </div>
              )}
              {detailRequest.canceled_at && (
                <div>
                  <div className="font-medium">Canceled</div>
                  <div className="text-muted-foreground">{new Date(detailRequest.canceled_at).toLocaleString()}</div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Manager</div>
                <div className="text-muted-foreground">{detailRequest.current_manager?.full_name ?? '-'}</div>
              </div>
              <div>
                <div className="font-medium">Backup</div>
                <div className="text-muted-foreground">{detailRequest.backup_person?.full_name ?? '-'}</div>
              </div>
              <div>
                <div className="font-medium">Internal Notifications</div>
                <div className="text-muted-foreground break-words">{(detailRequest.internal_notifications || []).join(', ') || '-'}</div>
              </div>
              <div>
                <div className="font-medium">External Notifications</div>
                <div className="text-muted-foreground break-words">{(detailRequest.external_notifications || []).join(', ') || '-'}</div>
              </div>
            </div>

            <div>
              <div className="font-medium">Projects</div>
              {detailRequest.projects && detailRequest.projects.length > 0 ? (
                <div className="mt-1 flex flex-wrap gap-1">
                  {detailRequest.projects.map((p) => (
                    <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground">-</div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="font-medium">Reason</div>
                <div className="text-muted-foreground whitespace-pre-wrap">{detailRequest.message || '-'}</div>
              </div>
              <div>
                <div className="font-medium">Approval Notes</div>
                <div className="text-muted-foreground whitespace-pre-wrap">{detailRequest.approval_notes || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
} 