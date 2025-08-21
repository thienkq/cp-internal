"use server"

import { createServerClient } from "@workspace/supabase"
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email';
import { generateLeaveRequestInfoTemplate, generateLeaveRequestActionTemplate } from '@/lib/email-templates';
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
import type { User } from "@workspace/supabase";

type SubmitLeaveRequestResult = 
  | { success: true;}
  | { success: false; error: string }



/**
 * Gets the authenticated user and handles authentication errors
 */
async function getAuthenticatedUser(supabase: any) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error("User not authenticated")
  }
  return user
}

/**
 * Inserts the leave request into the database
 */
async function insertLeaveRequest(supabase: any, leaveRequest: LeaveRequestInsert) {
  const { error } = await supabase
    .from('leave_requests')
    .insert([leaveRequest])

  if (error) {
    throw error
  }
}



async function sendLeaveRequestNotification(
  enrichedLeaveRequest: LeaveRequestWithEmailData,
  validatedData: LeaveRequestFormData
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
    
    // Base email data - no database queries needed!
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
    
    // Add internal notification emails from the enriched data
    if (enrichedLeaveRequest.internal_notification_emails) {
      informationalEmails.push(...enrichedLeaveRequest.internal_notification_emails);
    }
    
    // Add external notification emails
    if (validatedData.external_notifications) {
      informationalEmails.push(...validatedData.external_notifications);
    }

    // Send actionable emails to HR and managers
    const actionableRecipients = [...hrEmails, ...managerEmails];
    if (actionableRecipients.length > 0) {
      const actionEmailData = {
        ...baseEmailData,
        leaveRequestId: enrichedLeaveRequest.user_id, // We'll need the actual ID from the insert
        dashboardUrl,
      };
      
      const actionHtmlBody = generateLeaveRequestActionTemplate(actionEmailData);
      
      await sendEmail({
        to: [...new Set(actionableRecipients)], // Remove duplicates
        subject: `Leave Request ${enrichedLeaveRequest.requester_name} - Action Required: `,
        html: actionHtmlBody,
      });
    }

    // Send informational emails to requester, backup, and other notifications
    const uniqueInformationalEmails = [...new Set(informationalEmails.filter(email => email))];
    if (uniqueInformationalEmails.length > 0) {
      const infoHtmlBody = generateLeaveRequestInfoTemplate(baseEmailData);
      
      await sendEmail({
        to: uniqueInformationalEmails,
        subject: `Leave Request: ${enrichedLeaveRequest.requester_name}`,
        html: infoHtmlBody,
      });
    }
  } catch (error) {
    console.error('Failed to send leave request notification email:', error);
    // Do not rethrow, as the leave request was already created successfully.
  }
}

export async function submitLeaveRequest(formData: FormData): Promise<SubmitLeaveRequestResult> {
  try {
    const supabase = await createServerClient()
    
    // Process and validate form data
    const validatedData = processLeaveRequestFormData(formData)
    
    // Extract reference data from form
    const { leaveTypes, users } = extractReferenceData(formData)
    
    // Get authenticated user
    const user = await getAuthenticatedUser(supabase)
    
    // Prepare leave request for database insertion
    const leaveRequest = prepareLeaveRequestForInsert(validatedData, user.id)
    
    // Create enriched leave request with email data (no DB queries needed!)
    const enrichedLeaveRequest = enrichLeaveRequestWithEmailData(
      validatedData,
      user.id,
      leaveTypes,
      users,
      user.user_metadata?.full_name || user.email || 'Unknown User',
      user.email || ''
    )
    
    // Insert into database
    await insertLeaveRequest(supabase, leaveRequest)
    
    // Send email notification (no database queries!)
    await sendLeaveRequestNotification(enrichedLeaveRequest, validatedData);

    // Invalidate the cache for all paths that display leave request data
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/leave-requests')
    
    return { success: true as const }
  } catch (error) {
    console.error('Error submitting leave request:', error)
    
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
} 