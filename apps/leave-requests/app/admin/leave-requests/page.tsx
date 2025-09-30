import { PageContainer } from '@workspace/ui/components/page-container';
import AdminLeaveRequestsPageClient from './page.client';
import { getDb } from '@/db';
import { leaveRequests, users, leaveTypes } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { LeaveRequest } from '@/types';
import { LeaveType } from '@/types/leave-request';

export default async function AdminLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; tab?: string; userId?: string }>;
}) {
  const db = getDb();

  // Create aliases for the users table to avoid conflicts
  const requesterUser = alias(users, 'requester_user');
  const approverUser = alias(users, 'approver_user');

  // Fetch all leave requests with user and leave type information using Drizzle ORM
  const allLeaveRequests = await db
    .select({
      // All leave request fields
      id: leaveRequests.id,
      user_id: leaveRequests.user_id,
      leave_type_id: leaveRequests.leave_type_id,
      projects: leaveRequests.projects,
      internal_notifications: leaveRequests.internal_notifications,
      external_notifications: leaveRequests.external_notifications,
      current_manager_id: leaveRequests.current_manager_id,
      backup_id: leaveRequests.backup_id,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
      is_half_day: leaveRequests.is_half_day,
      half_day_type: leaveRequests.half_day_type,
      message: leaveRequests.message,
      emergency_contact: leaveRequests.emergency_contact,
      status: leaveRequests.status,
      approval_notes: leaveRequests.approval_notes,
      cancel_reason: leaveRequests.cancel_reason,
      approved_by_id: leaveRequests.approved_by_id,
      approved_at: leaveRequests.approved_at,
      canceled_at: leaveRequests.canceled_at,
      created_at: leaveRequests.created_at,
      updated_at: leaveRequests.updated_at,
      // User information (requester)
      user: {
        full_name: requesterUser.full_name,
        email: requesterUser.email,
      },
      // Leave type information
      leave_type: {
        name: leaveTypes.name,
        description: leaveTypes.description,
        is_paid: leaveTypes.is_paid,
      },
      // Approved by user information
      approved_by: {
        full_name: approverUser.full_name,
      },
    })
    .from(leaveRequests)
    .leftJoin(requesterUser, eq(leaveRequests.user_id, requesterUser.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .leftJoin(approverUser, eq(leaveRequests.approved_by_id, approverUser.id))
    .orderBy(desc(leaveRequests.created_at));

  // Cast the result to match the expected LeaveRequest type
  const typedLeaveRequests = allLeaveRequests as LeaveRequest[];

  const listLeaveTypes = (await db.select().from(leaveTypes)) as LeaveType[];

  const currentYear = new Date().getFullYear();
  const resolvedSearchParams = await searchParams;
  const selectedYear = resolvedSearchParams.year
    ? parseInt(resolvedSearchParams.year)
    : currentYear;

  // Compute date range for selected year
  const startOfYear = `${selectedYear}-01-01`;
  const endOfYear = `${selectedYear}-12-31`;

  // Fetch all active users
  const allUsers = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      email: users.email,
      start_date: users.start_date,
    })
    .from(users);

  // Fetch approved, paid leave requests within the selected year for all users
  const approvedPaidRequests = await db
    .select({
      user_id: leaveRequests.user_id,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
      is_half_day: leaveRequests.is_half_day,
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        eq(leaveTypes.is_paid, true),
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    );

  // Calculate working days per user (approved + paid/unpaid breakdown)
  // Note: We do calculation in application layer for accuracy (half-days, weekends)
  const { calculateWorkingDays } = await import('@/lib/utils');

  // Paid requests already fetched; also fetch approved unpaid
  const approvedUnpaidRequests = await db
    .select({
      user_id: leaveRequests.user_id,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
      is_half_day: leaveRequests.is_half_day,
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .where(
      and(
        eq(leaveRequests.status, 'approved'),
        eq(leaveTypes.is_paid, false),
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    );

  const paidUsageByUserId = new Map<string, number>();
  for (const r of approvedPaidRequests) {
    const days = calculateWorkingDays(
      r.start_date,
      r.end_date || null,
      r.is_half_day || false
    );
    paidUsageByUserId.set(
      r.user_id,
      (paidUsageByUserId.get(r.user_id) || 0) + days
    );
  }

  const unpaidUsageByUserId = new Map<string, number>();
  for (const r of approvedUnpaidRequests) {
    const days = calculateWorkingDays(
      r.start_date,
      r.end_date || null,
      r.is_half_day || false
    );
    unpaidUsageByUserId.set(
      r.user_id,
      (unpaidUsageByUserId.get(r.user_id) || 0) + days
    );
  }

  const usersWithUsage = allUsers.map((u) => {
    const paid = paidUsageByUserId.get(u.id) || 0;
    const unpaid = unpaidUsageByUserId.get(u.id) || 0;
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      start_date: u.start_date,
      paid_used_days: paid,
      unpaid_used_days: unpaid,
      used_days: paid + unpaid,
    };
  });

  const filterByType = (leaveType: LeaveType) => {
    return (allLeaveRequests || []).filter(
      (req: any) => req.leave_type_id === leaveType.id
    );
  };

  const leaveRequestsByType = listLeaveTypes.map((lt) => ({
    leaveType: lt,
    leaveRequests: filterByType(lt) as LeaveRequest[],
  }));

  return (
    <PageContainer>
      <AdminLeaveRequestsPageClient
        allLeaveRequests={typedLeaveRequests}
        defaultTab={resolvedSearchParams.tab || 'all'}
        selectedYear={selectedYear}
        leaveRequestsByType={leaveRequestsByType}
        usersWithUsage={usersWithUsage}
        selectedUserId={resolvedSearchParams.userId}
      />
    </PageContainer>
  );
}
