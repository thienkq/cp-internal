'use client';

import React, { useMemo } from 'react';
import { Button } from '@workspace/ui/components/button';
import { Filter, Download, CheckCircle2, XCircle, Clock, CalendarDays, DollarSign, Ban, Layers } from 'lucide-react';
import { LeaveRequest } from '@/types';
import { LeaveTypeTabs } from '@/components/admin/leave-type-tabs';
import { LeaveType } from '@/types/leave-request';
import { calculateWorkingDays } from '@/lib/utils';
import QuickStats from './components/QuickStats';
import UsageOverview from './components/UsageOverview';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@workspace/ui/components/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@workspace/ui/components/dialog';
import { Separator } from '@workspace/ui/components/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@workspace/ui/components/table';
import { getStatusBadge, formatDateRange } from '@/lib/leave-request-display-utils';

type UserUsage = {
  id: string;
  full_name: string | null;
  email: string | null;
  paid_used_days: number;
  unpaid_used_days: number;
  used_days: number;
};

const AdminLeaveRequestsPageClient = ({
  allLeaveRequests,
  leaveRequestsByType,
  defaultTab,
  selectedYear,
  usersWithUsage,
}: {
  allLeaveRequests: LeaveRequest[];
  leaveRequestsByType: {
    leaveType: LeaveType;
    leaveRequests: LeaveRequest[];
  }[];
  defaultTab: string;
  selectedYear: number;
  usersWithUsage: UserUsage[];
}) => {
  const totals = useMemo(() => {
    const total = allLeaveRequests?.length || 0;
    const paidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (r.status === 'approved' && r.leave_type?.is_paid) {
        return (
          sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day)
        );
      }
      return sum;
    }, 0);
    const unpaidApprovedDays = (allLeaveRequests || []).reduce((sum, r) => {
      if (
        r.status === 'approved' &&
        r.leave_type &&
        r.leave_type.is_paid === false
      ) {
        return (
          sum + calculateWorkingDays(r.start_date, r.end_date, r.is_half_day)
        );
      }
      return sum;
    }, 0);

    return { total, paidApprovedDays, unpaidApprovedDays };
  }, [allLeaveRequests]);

  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<UserUsage | null>(null);
  const [detail, setDetail] = React.useState<null | {
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
    entitlement?: { totalPaidDays: number | null; employmentYear: number | null };
    history: Array<{
      id: string;
      start_date: string;
      end_date: string | null;
      is_half_day: boolean;
      status: string;
      leave_type: { name: string | null; is_paid: boolean | null } | null;
    }>;
  }>(null);

  const openDetails = async (user: UserUsage) => {
    setSelectedUser(user);
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/leave-stats?year=${selectedYear}`);
      const data = await res.json();
      setDetail(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Leave Requests Management</h1>
          <p className='text-muted-foreground'>
            Manage and approve leave requests from all users
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm'>
            <Filter className='h-4 w-4 mr-2' />
            Filter
          </Button>
          <Button variant='outline' size='sm'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <QuickStats allLeaveRequests={allLeaveRequests} totals={totals} />

      {/* Usage Overview */}
      <UsageOverview allLeaveRequests={allLeaveRequests} totals={totals} />

      {/* All Leave Requests */}
      {/* Top-level Tabs: Leave Types and Users */}
      <div className='space-y-4'>
        <Tabs defaultValue='leave-types' className='w-full'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='leave-types' className='cursor-pointer'>
              Leave Types
            </TabsTrigger>
            <TabsTrigger value='users' className='cursor-pointer'>
              Users
            </TabsTrigger>
          </TabsList>

          <TabsContent value='leave-types' className='space-y-4'>
            <h2 className='text-xl font-semibold text-foreground'>
              Requests by Leave Type
            </h2>
            <LeaveTypeTabs
              selectedTab={defaultTab || 'all'}
              selectedYear={selectedYear}
              all={allLeaveRequests || []}
              leaveRequestsByType={leaveRequestsByType}
            />
          </TabsContent>

          <TabsContent value='users' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Users</CardTitle>
                <p className='text-sm text-muted-foreground'>
                  Approved paid leave days used in {selectedYear}
                </p>
              </CardHeader>
              <CardContent>
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='text-left border-b'>
                        <th className='py-2 pr-4'>Name</th>
                        <th className='py-2 pr-4'>Email</th>
                        <th className='py-2 pr-4'>Paid Days</th>
                        <th className='py-2 pr-4'>Unpaid Days</th>
                        <th className='py-2 pr-4'>Total Used</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(usersWithUsage || [])
                        .sort((a, b) => b.used_days - a.used_days)
                        .map((u) => (
                          <tr key={u.id} className='border-b last:border-b-0 hover:bg-accent cursor-pointer' onClick={() => openDetails(u)}>
                            <td className='py-2 pr-4'>{u.full_name || '-'}</td>
                            <td className='py-2 pr-4 text-muted-foreground'>{u.email || '-'}</td>
                            <td className='py-2 pr-4'>{u.paid_used_days}</td>
                            <td className='py-2 pr-4'>{u.unpaid_used_days}</td>
                            <td className='py-2 pr-4 font-medium'>{u.used_days}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='sm:max-w-2xl max-h-[85vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.full_name || selectedUser?.email || 'User'} - {selectedYear}
            </DialogTitle>
          </DialogHeader>
          {loading && <div className='text-sm text-muted-foreground'>Loading…</div>}
          {!loading && detail && (
            <div className='space-y-6'>
              {/* Stats cards styled similar to QuickStats */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                        <DollarSign className='w-5 h-5 text-green-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-green-600'>
                      {detail.stats.paidUsedDays}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Paid Days</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-primary/10 rounded-lg'>
                        <Layers className='w-5 h-5 text-primary' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-primary'>
                      {detail.entitlement?.totalPaidDays ?? '-'}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Total Paid Days (Entitlement)</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
                        <CalendarDays className='w-5 h-5 text-purple-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-purple-600'>
                      {detail.stats.unpaidUsedDays}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Unpaid Days</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                        <CheckCircle2 className='w-5 h-5 text-green-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-green-600'>
                      {detail.stats.totalApprovedRequests}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Approved</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg'>
                        <Clock className='w-5 h-5 text-orange-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-orange-600'>
                      {detail.stats.pendingRequests}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Pending</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-red-100 dark:bg-red-900/20 rounded-lg'>
                        <XCircle className='w-5 h-5 text-red-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-red-600'>
                      {detail.stats.rejectedRequests}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Rejected</p>
                  </CardHeader>
                </Card>
                <Card className='relative overflow-hidden group hover:shadow-lg transition-all duration-200'>
                  <CardHeader className='pb-3'>
                    <div className='flex items-center justify-between'>
                      <div className='p-2 bg-gray-100 dark:bg-gray-900/20 rounded-lg'>
                        <Ban className='w-5 h-5 text-gray-600' />
                      </div>
                    </div>
                    <CardTitle className='text-2xl font-bold text-gray-600'>
                      {detail.stats.canceledRequests}
                    </CardTitle>
                    <p className='text-sm text-muted-foreground'>Canceled</p>
                  </CardHeader>
                </Card>
              </div>

              <Separator />

              {/* History using shared Table components */}
              <div>
                <div className='text-sm font-medium mb-2'>History</div>
                <div className='max-h-72 overflow-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[260px]'>Dates</TableHead>
                        <TableHead className='w-[200px]'>Type</TableHead>
                        <TableHead className='w-[140px]'>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.history.map((h) => (
                        <TableRow key={h.id}>
                          <TableCell>
                            {formatDateRange(h.start_date, h.end_date, h.is_half_day, undefined)}
                          </TableCell>
                          <TableCell>
                            {h.leave_type?.name || '-'} {h.leave_type?.is_paid === false ? '(Unpaid)' : ''}
                          </TableCell>
                          <TableCell>{getStatusBadge(h.status)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeaveRequestsPageClient;
