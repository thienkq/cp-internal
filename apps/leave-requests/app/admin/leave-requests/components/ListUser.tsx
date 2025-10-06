'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  DollarSign,
  Ban,
  Layers,
  Eye,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog';
import { Separator } from '@workspace/ui/components/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@workspace/ui/components/table';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import {
  getStatusBadge,
  formatDateRange,
} from '@/lib/leave-request-display-utils';
import { calculateWorkingDays, formatWorkingDays } from '@/lib/utils';
import { UserUsage } from '../types';
import { ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';

type LocalUserUsage = UserUsage & { start_date?: string | null };
type SortKey = 'name' | 'email' | 'paid' | 'unpaid' | 'total' | 'start_date';

// Detail view types
type DetailResponse = {
  user: { id: string; full_name: string | null; email: string | null };
  stats: {
    year: number;
    paidUsedDays: number;
    unpaidUsedDays: number;
    totalApprovedRequests: number;
    pendingRequests: number;
    rejectedRequests: number;
    canceledRequests: number;
  };
  entitlement?: {
    totalPaidDays: number | null;
    employmentYear: number | null;
  };
  history: Array<{
    id: string;
    start_date: string;
    end_date: string | null;
    is_half_day: boolean;
    half_day_type?: 'morning' | 'afternoon' | null;
    status: string;
    message?: string | null;
    projects?: Array<{ id: string; name: string } | null> | null;
    approval_notes?: string | null;
    cancel_reason?: string | null;
    approved_at?: string | null;
    canceled_at?: string | null;
    created_at: string;
    leave_type: { name: string | null; is_paid: boolean | null } | null;
  }>;
};

// Sorting helpers
const toStringSafe = (value: string | null | undefined) =>
  (value ?? '').toString().toLowerCase();

const toNumberSafe = (value: number | null | undefined) =>
  typeof value === 'number' ? value : -Infinity;

const toDateMsSafe = (value: string | null | undefined) => {
  if (!value) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(value);
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t;
};

// UI subcomponents
const SortableHeader = ({
  label,
  column,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  sortKey: SortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) => {
  const ariaSort =
    sortKey === column
      ? sortDir === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none';

  const Icon = () => {
    if (sortKey !== column) return <ArrowUpDown className='h-4 w-4' />;
    return sortDir === 'asc' ? (
      <ChevronUp className='h-4 w-4' />
    ) : (
      <ChevronDown className='h-4 w-4' />
    );
  };

  return (
    <th
      className='py-2 pr-4'
      aria-sort={ariaSort as React.AriaAttributes['aria-sort']}
    >
      <button
        type='button'
        className='flex items-center gap-1 font-medium hover:underline'
        onClick={() => onSort(column)}
      >
        {label}
        <Icon />
      </button>
    </th>
  );
};

const ListUser = ({
  usersWithUsage,
  selectedYear,
}: {
  usersWithUsage: LocalUserUsage[];
  selectedYear: number;
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<LocalUserUsage | null>(
    null
  );
  const [detail, setDetail] = React.useState<null | DetailResponse>(null);
  const [expandedReason, setExpandedReason] = React.useState<string | null>(null);

  const [sortKey, setSortKey] = React.useState<SortKey>('total');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSort = (nextKey: SortKey) => {
    if (sortKey === nextKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(nextKey);
      setSortDir('asc');
    }
  };

  const filteredUsers = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return usersWithUsage || [];
    return (usersWithUsage || []).filter((u) => {
      const name = toStringSafe(u.full_name);
      const email = toStringSafe(u.email);
      return name.includes(query) || email.includes(query);
    });
  }, [usersWithUsage, searchQuery]);

  const sortedUsers = React.useMemo(() => {
    const data = [...(filteredUsers || [])];
    const direction = sortDir === 'asc' ? 1 : -1;

    data.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return (
            toStringSafe(a.full_name).localeCompare(toStringSafe(b.full_name)) *
            direction
          );
        case 'email':
          return (
            toStringSafe(a.email).localeCompare(toStringSafe(b.email)) *
            direction
          );
        case 'paid':
          return (
            (toNumberSafe(a.paid_used_days) - toNumberSafe(b.paid_used_days)) *
            direction
          );
        case 'unpaid':
          return (
            (toNumberSafe(a.unpaid_used_days) -
              toNumberSafe(b.unpaid_used_days)) *
            direction
          );
        case 'total':
          return (
            (toNumberSafe(a.used_days) - toNumberSafe(b.used_days)) * direction
          );
        case 'start_date':
          return (
            (toDateMsSafe(a.start_date) - toDateMsSafe(b.start_date)) *
            direction
          );
        default:
          return 0;
      }
    });
    return data;
  }, [filteredUsers, sortKey, sortDir]);

  const formatStartDate = (value: string | null | undefined) =>
    value
      ? new Date(value).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '-';

  const openDetails = React.useCallback(
    async (user: LocalUserUsage) => {
      setSelectedUser(user);
      setOpen(true);
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users/${user.id}/leave-stats?year=${selectedYear}`
        );
        if (!res.ok) {
          setDetail(null);
          return;
        }
        const data: DetailResponse = await res.json();
        setDetail(data);
      } catch (error) {
        setDetail(null);
        console.error('Failed to load user details', error);
      } finally {
        setLoading(false);
      }
    },
    [selectedYear]
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Users</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Approved paid leave days used in {selectedYear}
          </p>
          <div className='mt-3 max-w-sm'>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder='Search by name or email'
              aria-label='Search users by name or email'
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='text-left border-b'>
                  <SortableHeader
                    label='Name'
                    column='name'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label='Email'
                    column='email'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label='Paid Days'
                    column='paid'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label='Unpaid Days'
                    column='unpaid'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label='Total Used'
                    column='total'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label='Start Date'
                    column='start_date'
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={handleSort}
                  />
                  <th className='py-2 pr-4'>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className='border-b last:border-b-0 hover:bg-accent'
                  >
                    <td className='py-2 pr-4'>{u.full_name || '-'}</td>
                    <td className='py-2 pr-4 text-muted-foreground'>
                      {u.email || '-'}
                    </td>
                    <td className='py-2 pr-4'>{u.paid_used_days}</td>
                    <td className='py-2 pr-4'>{u.unpaid_used_days}</td>
                    <td className='py-2 pr-4 font-medium'>{u.used_days}</td>
                    <td className='py-2 pr-4'>
                      {formatStartDate(u.start_date)}
                    </td>
                    <td className='py-2 pr-4'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={(e) => {
                          e.stopPropagation();
                          openDetails(u);
                        }}
                        className='gap-1 cursor-pointer'
                      >
                        <Eye className='h-4 w-4' />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-6xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.full_name || selectedUser?.email || 'User'} -{' '}
              {selectedYear}
            </DialogTitle>
          </DialogHeader>
          {loading && (
            <div className='text-sm text-muted-foreground'>Loading…</div>
          )}
          {!loading && detail && (
            <div className='space-y-6'>
              {/* Usage Overview */}
              <div className='space-y-3'>
                <div className='text-lg font-medium'>Overview</div>
                
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {/* Leave Usage Summary */}
                  <Card className='p-4 hover:shadow-md transition-shadow'>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 mb-3'>
                        <div className='p-1.5 bg-primary/10 rounded'>
                          <Layers className='w-4 h-4 text-primary' />
                        </div>
                        <h3 className='font-medium text-sm'>Leave Usage</h3>
                      </div>
                      <div className='space-y-3'>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-primary rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Total Available Days</span>
                          </div>
                          <span className='text-sm font-semibold text-primary'>
                            {detail.entitlement?.totalPaidDays ?? '-'}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Paid Days Taken</span>
                          </div>
                          <span className='text-sm font-semibold text-green-600'>
                            {detail.stats.paidUsedDays}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Unpaid Days Taken</span>
                          </div>
                          <span className='text-sm font-semibold text-purple-600'>
                            {detail.stats.unpaidUsedDays}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Request Status Summary */}
                  <Card className='p-4 hover:shadow-md transition-shadow'>
                    <div className='space-y-4'>
                      <div className='flex items-center gap-2 mb-3'>
                        <div className='p-1.5 bg-orange-100 dark:bg-orange-900/20 rounded'>
                          <Clock className='w-4 h-4 text-orange-600' />
                        </div>
                        <h3 className='font-medium text-sm'>Request Status</h3>
                      </div>
                      <div className='space-y-3'>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Approved</span>
                          </div>
                          <span className='text-sm font-semibold text-green-600'>
                            {detail.stats.totalApprovedRequests}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Pending</span>
                          </div>
                          <span className='text-sm font-semibold text-orange-600'>
                            {detail.stats.pendingRequests}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-red-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Rejected</span>
                          </div>
                          <span className='text-sm font-semibold text-red-600'>
                            {detail.stats.rejectedRequests}
                          </span>
                        </div>
                        <div className='flex justify-between items-center'>
                          <div className='flex items-center gap-2'>
                            <div className='w-2 h-2 bg-gray-500 rounded-full'></div>
                            <span className='text-sm text-muted-foreground'>Canceled</span>
                          </div>
                          <span className='text-sm font-semibold text-gray-600'>
                            {detail.stats.canceledRequests}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              <Separator />

              {/* History using shared Table components */}
              <div>
                <div className='text-lg font-medium mb-2'>History</div>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
                      <TableRow>
                        <TableHead className='w-[220px]'>Status</TableHead>
                        <TableHead className='w-[260px]'>Dates</TableHead>
                        <TableHead className='w-[160px]'>Duration</TableHead>
                        <TableHead className='w-[200px]'>Type</TableHead>
                        <TableHead className='w-[200px]'>Projects</TableHead>
                        <TableHead className='w-[220px]'>Reason</TableHead>
                        <TableHead className='w-[170px]'>Submitted</TableHead>
                        <TableHead className='w-[180px]'>Processed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.history.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className='h-24 text-center text-muted-foreground'
                          >
                            No history found for this year
                          </TableCell>
                        </TableRow>
                      ) : (
                        detail.history.map((h) => (
                          <TableRow
                            key={h.id}
                            className='hover:bg-muted/50 [&:nth-child(odd)]:bg-muted/20'
                          >
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                {getStatusBadge(h.status)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <CalendarDays className='h-4 w-4 text-muted-foreground' />
                                {formatDateRange(
                                  h.start_date,
                                  h.end_date,
                                  h.is_half_day,
                                  h.half_day_type ?? undefined
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <span>
                                  {formatWorkingDays(
                                    calculateWorkingDays(
                                      h.start_date,
                                      h.end_date,
                                      h.is_half_day
                                    )
                                  )}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <span>
                                  {h.leave_type?.name || '-'}{' '}
                                  {h.leave_type?.is_paid === false ? (
                                    <span className='text-xs text-muted-foreground'>
                                      (Unpaid)
                                    </span>
                                  ) : null}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {h.projects && h.projects.length > 0 ? (
                                <div className='space-y-1 flex flex-wrap gap-1'>
                                  {h.projects.filter((p): p is { id: string; name: string } => !!p).map((p) => (
                                    <span key={p.id} className='inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs'>
                                      {p.name}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className='text-muted-foreground text-sm'>No projects</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {h.message ? (
                                <div className='max-w-[220px]'>
                                  <p 
                                    className='text-sm text-foreground truncate cursor-pointer hover:text-primary transition-colors' 
                                    title={h.message}
                                    onClick={() => setExpandedReason(h.message || null)}
                                  >
                                    {h.message}
                                  </p>
                                </div>
                              ) : (
                                <span className='text-muted-foreground text-sm'>No reason</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className='text-sm text-foreground'>
                                {h.created_at
                                  ? new Date(h.created_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })
                                  : '-'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {h.status === 'approved' && h.approved_at ? (
                                <div className='text-sm text-green-600'>
                                  <div className='font-medium'>Approved</div>
                                  <div className='text-xs'>
                                    {new Date(h.approved_at).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                    })}
                                  </div>
                                  {h.approval_notes && (
                                    <div className='text-xs text-muted-foreground truncate' title={h.approval_notes || undefined}>
                                      {h.approval_notes}
                                    </div>
                                  )}
                                </div>
                              ) : h.status === 'rejected' ? (
                                <div className='text-sm text-red-600'>
                                  <div className='font-medium'>Rejected</div>
                                  {h.approval_notes && (
                                    <div className='text-xs text-muted-foreground truncate' title={h.approval_notes || undefined}>
                                      {h.approval_notes}
                                    </div>
                                  )}
                                </div>
                              ) : h.status === 'canceled' ? (
                                <div className='text-sm text-gray-600'>
                                  <div className='font-medium'>Canceled</div>
                                  {h.cancel_reason && (
                                    <div className='text-xs text-muted-foreground truncate' title={h.cancel_reason || undefined}>
                                      {h.cancel_reason}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className='text-muted-foreground text-sm'>-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Reason expansion dialog */}
      <Dialog open={!!expandedReason} onOpenChange={() => setExpandedReason(null)}>
        <DialogContent className='sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Leave Request Reason</DialogTitle>
          </DialogHeader>
          <div className='mt-4'>
            <div className='bg-muted/50 rounded-lg p-4'>
              <p className='text-sm whitespace-pre-wrap break-words'>
                {expandedReason}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ListUser;
