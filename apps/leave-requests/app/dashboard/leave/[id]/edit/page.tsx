import { getCurrentUser } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import EditLeaveRequestPageClient from './page.client';
import { getLeaveRequestServerProps } from '@/lib/get-leave-request-server-props';
import { getDb } from '@/db';
import { leaveRequests, leaveTypes, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

interface EditLeaveRequestPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditLeaveRequestPage({
  params,
}: EditLeaveRequestPageProps) {
  const user = await getCurrentUser();

  const userId = user?.id as string;

  const { id } = await params;

  // Fetch the leave request to edit - ensure user owns it and it's pending
  const db = getDb();

  // Create table aliases for multiple joins on the same table
  const currentManager = alias(users, 'current_manager');
  const backupPerson = alias(users, 'backup_person');

  const leaveRequestResult = await db
    .select({
      // Leave request fields
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
      // Leave type fields
      leave_type: {
        id: leaveTypes.id,
        name: leaveTypes.name,
        description: leaveTypes.description,
        is_paid: leaveTypes.is_paid,
        supports_half_day: leaveTypes.supports_half_day,
        supports_carryover: leaveTypes.supports_carryover,
        quota: leaveTypes.quota,
      },
      // Current manager fields
      current_manager: {
        id: currentManager.id,
        full_name: currentManager.full_name,
        email: currentManager.email,
      },
      // Backup person fields
      backup_person: {
        id: backupPerson.id,
        full_name: backupPerson.full_name,
        email: backupPerson.email,
      },
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .leftJoin(
      currentManager,
      eq(leaveRequests.current_manager_id, currentManager.id)
    )
    .leftJoin(backupPerson, eq(leaveRequests.backup_id, backupPerson.id))
    .where(
      and(
        eq(leaveRequests.id, id),
        eq(leaveRequests.user_id, userId),
        eq(leaveRequests.status, 'pending')
      )
    )
    .limit(1);

  const leaveRequest = leaveRequestResult?.[0];

  if (!leaveRequest) {
    redirect('/dashboard/leave-requests');
  }

  const {
    leaveTypes: leaveTypesData,
    projects,
    users: usersData,
  } = await getLeaveRequestServerProps();

  return (
    <EditLeaveRequestPageClient
      leaveTypes={leaveTypesData || []}
      projects={projects || []}
      users={usersData || []}
      leaveRequest={leaveRequest as Record<string, unknown>}
    />
  );
}
