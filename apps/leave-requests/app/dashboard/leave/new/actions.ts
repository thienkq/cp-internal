"use server"

import { createServerClient } from "@workspace/supabase"
import { revalidatePath } from 'next/cache'
import { sendEmail } from '@/lib/email';
import { generateLeaveRequestInfoTemplate, generateLeaveRequestActionTemplate } from '@/lib/email-templates';
import { 
  processLeaveRequestFormData, 
  prepareLeaveRequestForInsert,
  type LeaveRequestInsert,
  type LeaveRequestFormData
} from "@/lib/leave-request-form-utils"
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
  supabase: any,
  leaveRequest: LeaveRequestInsert,
  validatedData: LeaveRequestFormData,
  requester: User
) {
  try {
    // Fetch all required data for the email template
    const [requesterProfile, leaveType, managerProfile, backupProfile] = await Promise.all([
      supabase
        .from('users')
        .select('full_name')
        .eq('id', requester.id)
        .single()
        .then(({ data }: any) => data),
      supabase
        .from('leave_types')
        .select('name')
        .eq('id', leaveRequest.leave_type_id)
        .single()
        .then(({ data }: any) => data),
      leaveRequest.current_manager_id
        ? supabase
            .from('users')
            .select('full_name, email')
            .eq('id', leaveRequest.current_manager_id)
            .single()
            .then(({ data }: any) => data)
        : Promise.resolve(null),
      leaveRequest.backup_id
        ? supabase
            .from('users')
            .select('full_name, email')
            .eq('id', leaveRequest.backup_id)
            .single()
            .then(({ data }: any) => data)
        : Promise.resolve(null)
    ]);
    
    const requesterName = requesterProfile?.full_name || requester.email || 'Unknown User';
    const dashboardUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Base email data
    const baseEmailData = {
      requesterName,
      requesterEmail: requester.email || '',
      leaveType: leaveType?.name || 'Unknown',
      startDate: leaveRequest.start_date,
      endDate: leaveRequest.end_date,
      isHalfDay: leaveRequest.is_half_day,
      halfDayType: leaveRequest.half_day_type,
      message: leaveRequest.message,
      emergencyContact: leaveRequest.emergency_contact,
      projects: leaveRequest.projects,
      managerName: managerProfile?.full_name || null,
      backupName: backupProfile?.full_name || null,
      status: leaveRequest.status,
    };

    // Prepare recipient groups
    const hrEmails = ['hr@coderpush.com'];
    const managerEmails = managerProfile?.email ? [managerProfile.email] : [];
    const informationalEmails = [];
    
    // Add requester to informational emails
    if (requester.email) {
      informationalEmails.push(requester.email);
    }
    
    // Add backup person to informational emails
    if (backupProfile?.email) {
      informationalEmails.push(backupProfile.email);
    }
    
    // Add internal/external notifications to informational emails
    if (validatedData.internal_notifications) {
      informationalEmails.push(...validatedData.internal_notifications);
    }
    if (validatedData.external_notifications) {
      informationalEmails.push(...validatedData.external_notifications);
    }

    // Send actionable emails to HR and managers
    const actionableRecipients = [...hrEmails, ...managerEmails];
    if (actionableRecipients.length > 0) {
      const actionEmailData = {
        ...baseEmailData,
        leaveRequestId: leaveRequest.user_id, // We'll need the actual ID from the insert
        dashboardUrl,
      };
      
      const actionHtmlBody = generateLeaveRequestActionTemplate(actionEmailData);
      
      await sendEmail({
        to: [...new Set(actionableRecipients)], // Remove duplicates
        subject: `Leave Request - Action Required: ${requesterName}`,
        html: actionHtmlBody,
      });
    }

    // Send informational emails to requester, backup, and other notifications
    const uniqueInformationalEmails = [...new Set(informationalEmails.filter(email => email))];
    if (uniqueInformationalEmails.length > 0) {
      const infoHtmlBody = generateLeaveRequestInfoTemplate(baseEmailData);
      
      await sendEmail({
        to: uniqueInformationalEmails,
        subject: `Leave Request Confirmation: ${requesterName}`,
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
    
    // Get authenticated user
    const user = await getAuthenticatedUser(supabase)
    
    // Prepare leave request for database insertion
    const leaveRequest = prepareLeaveRequestForInsert(validatedData, user.id)
    
    // Insert into database
    await insertLeaveRequest(supabase, leaveRequest)
    
    // Send email notification
    await sendLeaveRequestNotification(supabase, leaveRequest, validatedData, user);

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