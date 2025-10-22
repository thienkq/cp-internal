"use server"

import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email';
import { generateLeaveRequestInfoTemplate } from '@/lib/email-templates';
import {
  processLeaveRequestFormData,
  prepareLeaveRequestForInsert,
  enrichLeaveRequestWithEmailData,
  extractReferenceData,
  type LeaveRequestInsert,
  type LeaveRequestFormData,
  type LeaveRequestWithEmailData
} from "@/lib/leave-request-form-utils"
import { calculateWorkingDays, formatWorkingDays } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth-utils';

type ActionResult =
  | { success: true;}
  | { success: false; error: string }

/**
 * Gets the authenticated user and handles authentication errors
 */
async function getAuthenticatedUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error("User not authenticated")
  }
  return user
}

/**
 * Validates that the user owns the leave request and it's in pending status
 */
async function validateUserOwnsRequest(requestId: string, userId: string) {
  const { getDb } = await import('@/db');
  const { leaveRequests } = await import('@/db/schema');
  const { eq, and } = await import('drizzle-orm');

  const db = getDb();
  const request = await db
    .select()
    .from(leaveRequests)
    .where(and(
      eq(leaveRequests.id, requestId),
      eq(leaveRequests.user_id, userId)
    ))
    .limit(1);

  if (request.length === 0) {
    throw new Error("Leave request not found")
  }

  if (request[0].status !== 'pending') {
    throw new Error("Only pending leave requests can be modified")
  }

  return request[0]
}

/**
 * Updates a leave request in the database
 */
async function updateLeaveRequest(requestId: string, updateData: Partial<LeaveRequestInsert>): Promise<void> {
  const { getDb } = await import('@/db');
  const { leaveRequests } = await import('@/db/schema');
  const { eq } = await import('drizzle-orm');

  const db = getDb();
  await db
    .update(leaveRequests)
    .set({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .where(eq(leaveRequests.id, requestId))
}

/**
 * Sends notification emails for leave request changes
 */
async function sendLeaveRequestChangeNotification(
  enrichedLeaveRequest: LeaveRequestWithEmailData,
  validatedData: LeaveRequestFormData,
  changeType: 'updated' | 'canceled',
  cancelReason?: string
) {
  try {
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Calculate working days
    const workingDays = calculateWorkingDays(
      enrichedLeaveRequest.start_date,
      enrichedLeaveRequest.end_date,
      enrichedLeaveRequest.is_half_day
    );
    const formattedDays = formatWorkingDays(workingDays);
    
    // Base email data
    const baseEmailData = {
      requesterName: enrichedLeaveRequest.requester_name,
      requesterEmail: enrichedLeaveRequest.requester_email,
      leaveType: enrichedLeaveRequest.leave_type_name,
      startDate: enrichedLeaveRequest.start_date,
      endDate: enrichedLeaveRequest.end_date,
      isHalfDay: enrichedLeaveRequest.is_half_day,
      halfDayType: enrichedLeaveRequest.half_day_type,
      workingDays,
      formattedDays,
      message: enrichedLeaveRequest.message,
      emergencyContact: enrichedLeaveRequest.emergency_contact,
      projects: enrichedLeaveRequest.projects,
      managerName: enrichedLeaveRequest.manager_name,
      managerEmail: enrichedLeaveRequest.manager_email,
      backupName: enrichedLeaveRequest.backup_name,
      status: enrichedLeaveRequest.status,
      ...(cancelReason && { cancelReason })
    };

    // Prepare recipient groups
    const hrEmails = process.env.HR_EMAIL ? [process.env.HR_EMAIL] : [];
    const managerEmails = enrichedLeaveRequest.manager_email ? [enrichedLeaveRequest.manager_email] : [];
    const informationalEmails = [];
    
    // Add requester to informational emails
    if (enrichedLeaveRequest.requester_email) {
      informationalEmails.push(enrichedLeaveRequest.requester_email);
    }
    
    // Add backup person to informational emails
    if (enrichedLeaveRequest.backup_email) {
      informationalEmails.push(enrichedLeaveRequest.backup_email);
    }
    
    // Add internal notification emails
    if (enrichedLeaveRequest.internal_notification_emails) {
      informationalEmails.push(...enrichedLeaveRequest.internal_notification_emails);
    }
    
    // Add external notification emails
    if (validatedData.external_notifications) {
      informationalEmails.push(...validatedData.external_notifications);
    }

    // Send emails to all relevant parties
    const allRecipients = [...hrEmails, ...managerEmails, ...informationalEmails];
    const uniqueRecipients = [...new Set(allRecipients.filter(email => email))];
    
    if (uniqueRecipients.length > 0) {
      const subject = changeType === 'canceled' 
        ? `Leave Request Canceled: ${enrichedLeaveRequest.requester_name}`
        : `Leave Request Updated: ${enrichedLeaveRequest.requester_name}`;
      
      const infoHtmlBody = generateLeaveRequestInfoTemplate(baseEmailData);
      
      await sendEmail({
        to: uniqueRecipients,
        subject,
        html: infoHtmlBody,
      });
    }
  } catch (error) {
    console.error('Failed to send leave request change notification email:', error);
    // Do not rethrow, as the leave request was already updated successfully.
  }
}

/**
 * Edits a pending leave request
 */
export async function editLeaveRequest(requestId: string, formData: FormData): Promise<ActionResult> {
  try {
    // Process and validate form data
    const validatedData = processLeaveRequestFormData(formData)

    // Extract reference data from form
    const { leaveTypes, users } = extractReferenceData(formData)

    // Get authenticated user
    const user = await getAuthenticatedUser()

    // Validate user owns the request and it's pending
    await validateUserOwnsRequest(requestId, user.id)

    // Prepare leave request for database update
    const leaveRequestUpdate = prepareLeaveRequestForInsert(validatedData, user.id)

    // Remove fields that shouldn't be updated during edit
    const { status, created_at, ...updateData } = leaveRequestUpdate as any

    // Update the leave request in database
    await updateLeaveRequest(requestId, updateData)

    // Create enriched leave request with email data for notifications
    const enrichedLeaveRequest = enrichLeaveRequestWithEmailData(
      validatedData,
      user.id,
      leaveTypes,
      users,
      user.full_name || user.email || 'Unknown User',
      user.email || ''
    )

    // Add the leave request ID to the enriched data
    const enrichedLeaveRequestWithId = {
      ...enrichedLeaveRequest,
      id: requestId
    }

    // Send email notification
    // TODO: Refactor to background job to send email
    await sendLeaveRequestChangeNotification(enrichedLeaveRequestWithId, validatedData, 'updated');

    // Invalidate the cache for all paths that display leave request data
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/leave-requests')

    return { success: true as const }
  } catch (error) {
    console.error('Error editing leave request:', error)

    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}

/**
 * Cancels a pending leave request
 */
export async function cancelLeaveRequest(requestId: string, cancelReason: string): Promise<ActionResult> {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser()

    // Validate user owns the request and it's pending
    const currentRequest = await validateUserOwnsRequest(requestId, user.id)

    // Update the leave request status to canceled
    await updateLeaveRequest(requestId, {
      status: 'canceled',
      cancel_reason: cancelReason,
      canceled_at: new Date().toISOString()
    })

    // Create enriched data for email notification
    const enrichedLeaveRequest: LeaveRequestWithEmailData = {
      id: requestId,
      user_id: user.id,
      requester_name: user.full_name || user.email || 'Unknown User',
      requester_email: user.email || '',
      leave_type_id: currentRequest.leave_type_id,
      leave_type_name: 'Leave', // Will be populated from database if needed
      start_date: currentRequest.start_date,
      end_date: currentRequest.end_date,
      is_half_day: currentRequest.is_half_day,
      half_day_type: currentRequest.half_day_type,
      message: currentRequest.message,
      emergency_contact: currentRequest.emergency_contact,
      projects: currentRequest.projects || [],
      current_manager_id: currentRequest.current_manager_id,
      manager_name: '',
      manager_email: '',
      backup_id: currentRequest.backup_id,
      backup_name: '',
      backup_email: '',
      internal_notifications: currentRequest.internal_notifications || [],
      external_notifications: currentRequest.external_notifications || [],
      internal_notification_emails: [],
      status: 'canceled'
    }
    
    // Create minimal form data for email template
    const formDataForEmail: LeaveRequestFormData = {
      leave_type_id: currentRequest.leave_type_id,
      start_date: currentRequest.start_date,
      end_date: currentRequest.end_date,
      is_half_day: currentRequest.is_half_day,
      half_day_type: currentRequest.half_day_type,
      message: currentRequest.message || '',
      emergency_contact: currentRequest.emergency_contact,
      projects: currentRequest.projects || [],
      current_manager_id: currentRequest.current_manager_id,
      backup_id: currentRequest.backup_id,
      internal_notifications: currentRequest.internal_notifications || [],
      external_notifications: currentRequest.external_notifications || []
    }
    
    // Send email notification
    // TODO: Refactor to background job to send email
    await sendLeaveRequestChangeNotification(enrichedLeaveRequest, formDataForEmail, 'canceled', cancelReason);

    // Invalidate the cache for all paths that display leave request data
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/leave-requests')
    
    return { success: true as const }
  } catch (error) {
    console.error('Error canceling leave request:', error)
    
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
}