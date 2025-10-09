/**
 * Admin Leave Requests Page
 * 
 * This page displays all leave requests for administrative review and management.
 * It provides functionality to:
 * - View all leave requests with user and leave type details
 * - Filter requests by year and leave type
 * - Calculate and display leave usage statistics per user
 * - Group requests by leave type for better organization
 * 
 * The page is structured with:
 * - Data fetching functions for better separation of concerns
 * - Type-safe interfaces for all data structures
 * - Parallel data fetching for improved performance
 * - Clear business logic separation
 */

import { PageContainer } from '@workspace/ui/components/page-container';
import AdminLeaveRequestsPageClient from './page.client';
import { getDb } from '@/db';
import { leaveRequests, users, leaveTypes } from '@/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { LeaveRequest } from '@/types';
import { LeaveType } from '@/types/leave-request';
import { calculateWorkingDays } from '@/lib/utils';

// Types for better type safety
interface UserWithUsage {
  id: string;
  full_name: string;
  email: string;
  start_date: string;
  paid_used_days: number;
  unpaid_used_days: number;
  used_days: number;
}

interface LeaveRequestWithDetails extends LeaveRequest {
  user: {
    full_name: string;
    email: string;
  };
  leave_type: {
    name: string;
    description: string;
    is_paid: boolean;
  };
  approved_by: {
    full_name: string;
  };
}

interface LeaveRequestsByType {
  leaveType: LeaveType;
  leaveRequests: LeaveRequest[];
}

/**
 * Fetches all leave requests with user and leave type information for a specific year
 */
async function fetchAllLeaveRequests(year: number): Promise<LeaveRequestWithDetails[]> {
  const db = getDb();
  
  // Create aliases for the users table to avoid conflicts
  const requesterUser = alias(users, 'requester_user');
  const approverUser = alias(users, 'approver_user');
  const currentManagerUser = alias(users, 'current_manager_user');
  const backupUser = alias(users, 'backup_user');

  // Define date range for the selected year
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

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
      // Current manager information
      current_manager: {
        full_name: currentManagerUser.full_name,
        email: currentManagerUser.email,
      },
      // Backup person information
      backup_person: {
        full_name: backupUser.full_name,
        email: backupUser.email,
      },
    })
    .from(leaveRequests)
    .leftJoin(requesterUser, eq(leaveRequests.user_id, requesterUser.id))
    .leftJoin(leaveTypes, eq(leaveRequests.leave_type_id, leaveTypes.id))
    .leftJoin(approverUser, eq(leaveRequests.approved_by_id, approverUser.id))
    .leftJoin(currentManagerUser, eq(leaveRequests.current_manager_id, currentManagerUser.id))
    .leftJoin(backupUser, eq(leaveRequests.backup_id, backupUser.id))
    .where(
      and(
        gte(leaveRequests.start_date, startOfYear),
        lte(leaveRequests.start_date, endOfYear)
      )
    )
    .orderBy(desc(leaveRequests.created_at));

  return allLeaveRequests as LeaveRequestWithDetails[];
}

/**
 * Fetches all leave types
 */
async function fetchLeaveTypes(): Promise<LeaveType[]> {
  const db = getDb();
  return await db.select().from(leaveTypes);
}

/**
 * Fetches all active users
 */
async function fetchAllUsers() {
  const db = getDb();
  return await db
    .select({
      id: users.id,
      full_name: users.full_name,
      email: users.email,
      start_date: users.start_date,
    })
    .from(users);
}

/**
 * Fetches approved leave requests within a date range, filtered by paid status
 */
async function fetchApprovedLeaveRequests(
  startDate: string,
  endDate: string,
  isPaid: boolean
) {
  const db = getDb();
  
  return await db
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
        eq(leaveTypes.is_paid, isPaid),
        gte(leaveRequests.start_date, startDate),
        lte(leaveRequests.start_date, endDate)
      )
    );
}

/**
 * Calculates working days usage for a list of leave requests
 */
function calculateUsageByUser(requests: Array<{
  user_id: string;
  start_date: string;
  end_date: string | null;
  is_half_day: boolean | null;
}>): Map<string, number> {
  const usageByUserId = new Map<string, number>();
  
  for (const request of requests) {
    const days = calculateWorkingDays(
      request.start_date,
      request.end_date || null,
      request.is_half_day || false
    );
    
    usageByUserId.set(
      request.user_id,
      (usageByUserId.get(request.user_id) || 0) + days
    );
  }
  
  return usageByUserId;
}

/**
 * Combines user data with their leave usage statistics
 */
function combineUsersWithUsage(
  allUsers: Array<{ 
    id: string; 
    full_name: string | null; 
    email: string | null; 
    start_date: string | null 
  }>,
  paidUsage: Map<string, number>,
  unpaidUsage: Map<string, number>
): UserWithUsage[] {
  return allUsers.map((user) => {
    const paid = paidUsage.get(user.id) || 0;
    const unpaid = unpaidUsage.get(user.id) || 0;
    
    return {
      id: user.id,
      full_name: user.full_name || '',
      email: user.email || '',
      start_date: user.start_date || '',
      paid_used_days: paid,
      unpaid_used_days: unpaid,
      used_days: paid + unpaid,
    };
  });
}

/**
 * Groups leave requests by leave type
 */
function groupLeaveRequestsByType(
  allLeaveRequests: LeaveRequest[],
  leaveTypes: LeaveType[]
): LeaveRequestsByType[] {
  const filterByType = (leaveType: LeaveType) => {
    return allLeaveRequests.filter(
      (request) => request.leave_type_id === leaveType.id
    );
  };

  return leaveTypes.map((leaveType) => ({
    leaveType,
    leaveRequests: filterByType(leaveType),
  }));
}

export default async function AdminLeaveRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; tab?: string; userId?: string }>;
}) {
  // Parse search parameters
  const resolvedSearchParams = await searchParams;
  const currentYear = new Date().getFullYear();
  const selectedYear = resolvedSearchParams.year
    ? parseInt(resolvedSearchParams.year)
    : currentYear;

  // Define date range for the selected year
  const startOfYear = `${selectedYear}-01-01`;
  const endOfYear = `${selectedYear}-12-31`;

  // Fetch all required data in parallel for better performance
  const [
    allLeaveRequests,
    leaveTypes,
    allUsers,
    approvedPaidRequests,
    approvedUnpaidRequests,
  ] = await Promise.all([
    fetchAllLeaveRequests(selectedYear),
    fetchLeaveTypes(),
    fetchAllUsers(),
    fetchApprovedLeaveRequests(startOfYear, endOfYear, true), // paid
    fetchApprovedLeaveRequests(startOfYear, endOfYear, false), // unpaid
  ]);

  // Calculate usage statistics
  const paidUsageByUserId = calculateUsageByUser(approvedPaidRequests);
  const unpaidUsageByUserId = calculateUsageByUser(approvedUnpaidRequests);

  // Combine user data with usage statistics
  const usersWithUsage = combineUsersWithUsage(
    allUsers,
    paidUsageByUserId,
    unpaidUsageByUserId
  );

  // Group leave requests by type
  const leaveRequestsByType = groupLeaveRequestsByType(
    allLeaveRequests,
    leaveTypes
  );

  return (
    <PageContainer>
      <AdminLeaveRequestsPageClient
        allLeaveRequests={allLeaveRequests}
        defaultTab={resolvedSearchParams.tab || 'all'}
        selectedYear={selectedYear}
        leaveRequestsByType={leaveRequestsByType}
        usersWithUsage={usersWithUsage}
        selectedUserId={resolvedSearchParams.userId}
      />
    </PageContainer>
  );
}
