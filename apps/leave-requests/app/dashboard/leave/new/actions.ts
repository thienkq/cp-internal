"use server"

import { createServerClient } from "@workspace/supabase"
import { redirect } from "next/navigation"
import { z } from "zod"
import { leaveRequestSchema } from "@/lib/leave-request-schema"

// Helper function to safely parse half_day_type
function parseHalfDayType(value: FormDataEntryValue | null): "morning" | "afternoon" | null {
  if (!value || value === "") return null
  if (value === "morning" || value === "afternoon") return value
  return null
}

export async function submitLeaveRequest(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Extract and validate form data
    const rawData = {
      leave_type_id: formData.get("leave_type_id"),
      start_date: formData.get("start_date"),
      end_date: formData.get("end_date"),
      is_half_day: formData.get("is_half_day"),
      half_day_type: formData.get("half_day_type"),
      message: formData.get("message"),
      emergency_contact: formData.get("emergency_contact"),
      projects: formData.get("projects"),
      current_manager_id: formData.get("current_manager_id"),
      backup_id: formData.get("backup_id"),
      internal_notifications: formData.get("internal_notifications"),
      external_notifications: formData.get("external_notifications")
    }

    // Parse and validate the data
    const parsedData = {
      leave_type_id: parseInt(rawData.leave_type_id as string) || 0,
      start_date: rawData.start_date as string,
      end_date: rawData.end_date as string || null,
      is_half_day: rawData.is_half_day === "true",
      half_day_type: parseHalfDayType(rawData.half_day_type),
      message: rawData.message as string,
      emergency_contact: rawData.emergency_contact as string || null,
      projects: rawData.projects ? JSON.parse(rawData.projects as string) : [],
      current_manager_id: rawData.current_manager_id as string || null,
      backup_id: rawData.backup_id as string || null,
      internal_notifications: rawData.internal_notifications ? JSON.parse(rawData.internal_notifications as string) : [],
      external_notifications: rawData.external_notifications ? JSON.parse(rawData.external_notifications as string) : []
    }


    const validatedData = leaveRequestSchema.parse(parsedData)

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const leaveRequest = {
      user_id: user.id,
      leave_type_id: validatedData.leave_type_id,
      start_date: validatedData.start_date,
      end_date: validatedData.is_half_day ? null : validatedData.end_date,
      is_half_day: validatedData.is_half_day,
      half_day_type: validatedData.half_day_type,
      message: validatedData.message,
      emergency_contact: validatedData.emergency_contact,
      projects: validatedData.projects.length > 0 ? validatedData.projects : null,
      current_manager_id: validatedData.current_manager_id,
      backup_id: validatedData.backup_id,
      internal_notifications: validatedData.internal_notifications.length > 0 ? validatedData.internal_notifications : null,
      external_notifications: validatedData.external_notifications.length > 0 ? validatedData.external_notifications : null,
      status: 'pending'
    }

    const { error } = await supabase
      .from('leave_requests')
      .insert([leaveRequest])

    if (error) throw error

    redirect('/dashboard?success=leave-request-submitted')
  } catch (error) {
    console.error('Error submitting leave request:', error)
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`)
    }
    
    // For now, just throw the error - you can add proper error handling later
    throw error
  }
} 