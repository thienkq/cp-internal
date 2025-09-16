import { PageContainer } from '@workspace/ui/components/page-container';
import AdminLeaveRequestsPageClient from './page.client';
import { getDb } from '@/db';
import { leaveRequests, users, leaveTypes } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { LeaveRequest } from '@/types';

export default async function AdminLeaveRequestsPage() {
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

  return (
    <PageContainer>
      <AdminLeaveRequestsPageClient allLeaveRequests={typedLeaveRequests} />
    </PageContainer>
  );
}
