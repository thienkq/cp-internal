import { getDb } from '@/db';
import { companySettings, leaveRequests, leaveTypes, users } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/auth-utils';
import { getAdminUser } from '@/lib/user-db-utils';
import { NextRequest } from 'next/server';
import { calculateWorkingDays } from '@/lib/utils';
import { calculateCompleteLeaveEntitlement } from '@/lib/leave-quota-utils';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  // Authentication: ensure the caller is an authenticated admin
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await getAdminUser(user.id);
  } catch {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  const db = getDb();

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get('year');
  const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;
  const { userId } = await params;

  const [userRecord] = await db
    .select({
      id: users.id,
      full_name: users.full_name,
      email: users.email,
      start_date: users.start_date,
    })
    .from(users)
    .where(eq(users.id, userId));

  if (!userRecord) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const requests = await db
    .select({
      id: leaveRequests.id,
      leave_type_id: leaveRequests.leave_type_id,
      start_date: leaveRequests.start_date,
      end_date: leaveRequests.end_date,
      is_half_day: leaveRequests.is_half_day,
      half_day_type: leaveRequests.half_day_type,
      status: leaveRequests.status,
      message: leaveRequests.message,
      projects: leaveRequests.projects,
      approval_notes: leaveRequests.approval_notes,
      cancel_reason: leaveRequests.cancel_reason,
      approved_at: leaveRequests.approved_at,
      canceled_at: leaveRequests.canceled_at,
      created_at: leaveRequests.created_at,
      leave_type: {
        name: leaveTypes.name,
        is_paid: leaveTypes.is_paid,
      },
    })
    .from(leaveRequests)
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .where(
      and(
        eq(leaveRequests.user_id, userId),
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    )
    .orderBy(desc(leaveRequests.start_date));

  let paidUsedDays = 0;
  let unpaidUsedDays = 0;

  for (const r of requests) {
    if (r.status === 'approved') {
      const days = calculateWorkingDays(
        r.start_date,
        r.end_date || null,
        r.is_half_day || false
      );
      if (r.leave_type?.is_paid) {
        paidUsedDays += days;
      } else {
        unpaidUsedDays += days;
      }
    }
  }

  const stats = {
    year,
    paidUsedDays,
    unpaidUsedDays,
    totalApprovedRequests: requests.filter((r) => r.status === 'approved')
      .length,
    pendingRequests: requests.filter((r) => r.status === 'pending').length,
    rejectedRequests: requests.filter((r) => r.status === 'rejected').length,
    canceledRequests: requests.filter((r) => r.status === 'canceled').length,
  };

  // Compute paid entitlement using leave-quota-utils totalQuota
  let entitlement: {
    totalPaidDays: number | null;
    employmentYear: number | null;
  } = {
    totalPaidDays: null,
    employmentYear: null,
  };

  try {
    const startDate = userRecord.start_date
      ? new Date(userRecord.start_date)
      : null;
    const targetDate = new Date(`${year}-12-31`);

    if (startDate && !Number.isNaN(startDate.getTime())) {
      // Calculate employment year (1-based) for reporting
      let years = targetDate.getFullYear() - startDate.getFullYear();
      const annivThisYear = new Date(
        targetDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      if (targetDate < annivThisYear) {
        years -= 1;
      }
      const employmentYear = Math.max(1, years + 1);

      // Get authoritative total quota from leave-quota-utils
      const fullEntitlement = await calculateCompleteLeaveEntitlement(
        userRecord.id,
        targetDate
      );
      const totalPaidDays = fullEntitlement.totalQuota;

      entitlement = { totalPaidDays, employmentYear };
    }
  } catch {
    // Ignore entitlement errors and keep nulls
  }

  return Response.json({
    user: userRecord,
    stats,
    entitlement,
    history: requests,
  });
}
