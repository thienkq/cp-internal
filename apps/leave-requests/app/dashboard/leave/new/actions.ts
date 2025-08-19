"use server"

import { createServerClient } from "@workspace/supabase"
import { redirect } from "next/navigation"

export async function submitLeaveRequest(formData: FormData) {
  try {
    const supabase = await createServerClient()
    
    // Get form data
    const leaveTypeId = parseInt(formData.get("leave_type_id") as string)
    const startDate = formData.get("start_date") as string
    const endDate = formData.get("end_date") as string
    const isHalfDay = formData.get("is_half_day") === "true"
    const halfDayType = formData.get("half_day_type") as string
    const message = formData.get("message") as string
    const emergencyContact = formData.get("emergency_contact") as string
    const projects = formData.get("projects") as string
    const currentManagerId = formData.get("current_manager_id") as string
    const backupId = formData.get("backup_id") as string
    const internalNotifications = formData.get("internal_notifications") as string
    const externalNotifications = formData.get("external_notifications") as string

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    // Parse arrays from form data
    const projectsArray = projects ? JSON.parse(projects) : []
    const internalNotificationsArray = internalNotifications ? JSON.parse(internalNotifications) : []
    const externalNotificationsArray = externalNotifications ? JSON.parse(externalNotifications) : []

    const leaveRequest = {
      user_id: user.id,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: isHalfDay ? null : endDate,
      is_half_day: isHalfDay,
      half_day_type: halfDayType || null,
      message: message,
      emergency_contact: emergencyContact || null,
      projects: projectsArray.length > 0 ? projectsArray : null,
      current_manager_id: currentManagerId || null,
      backup_id: backupId || null,
      internal_notifications: internalNotificationsArray.length > 0 ? internalNotificationsArray : null,
      external_notifications: externalNotificationsArray.length > 0 ? externalNotificationsArray : null,
      status: 'pending'
    }

    const { error } = await supabase
      .from('leave_requests')
      .insert([leaveRequest])

    if (error) throw error

    redirect('/dashboard?success=leave-request-submitted')
  } catch (error) {
    console.error('Error submitting leave request:', error)
    // For now, just throw the error - you can add proper error handling later
    throw error
  }
} 