"use server"

import { createServerClient } from "@workspace/supabase"
import { 
  processLeaveRequestFormData, 
  prepareLeaveRequestForInsert,
  type LeaveRequestInsert 
} from "@/lib/leave-request-form-utils"

type SubmitLeaveRequestResult = 
  | { success: true; redirectTo: string }
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
    
    // Return success result instead of redirecting
    return { success: true as const, redirectTo: '/dashboard?success=leave-request-submitted' }
  } catch (error) {
    console.error('Error submitting leave request:', error)
    
    // Return error result instead of throwing
    return { 
      success: false as const, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }
  }
} 