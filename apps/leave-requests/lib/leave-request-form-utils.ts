import { z } from "zod"
import { leaveRequestSchema, type LeaveRequestFormData } from "./leave-request-schema"

export type { LeaveRequestFormData }

export interface RawFormData {
  leave_type_id: FormDataEntryValue | null
  start_date: FormDataEntryValue | null
  end_date: FormDataEntryValue | null
  is_half_day: FormDataEntryValue | null
  half_day_type: FormDataEntryValue | null
  message: FormDataEntryValue | null
  emergency_contact: FormDataEntryValue | null
  projects: FormDataEntryValue | null
  current_manager_id: FormDataEntryValue | null
  backup_id: FormDataEntryValue | null
  internal_notifications: FormDataEntryValue | null
  external_notifications: FormDataEntryValue | null
}

export interface LeaveRequestInsert {
  user_id: string
  leave_type_id: number
  start_date: string
  end_date: string | null
  is_half_day: boolean
  half_day_type: "morning" | "afternoon" | null
  message: string
  emergency_contact: string | null
  projects: Array<{ id: string | null; name: string }> | null
  current_manager_id: string | null
  backup_id: string | null
  internal_notifications: string[] | null
  external_notifications: string[] | null
  status: string
}

/**
 * Helper function to safely parse half_day_type
 */
function parseHalfDayType(value: FormDataEntryValue | null): "morning" | "afternoon" | null {
  if (!value || value === "") return null
  if (value === "morning" || value === "afternoon") return value
  return null
}

/**
 * Extracts and parses form data from FormData object
 */
export function extractFormData(formData: FormData): RawFormData {
  return {
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
}

/**
 * Parses raw form data into typed format for validation
 */
export function parseFormData(rawData: RawFormData): LeaveRequestFormData {
  return {
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
}

/**
 * Validates leave request data using the schema
 */
export function validateLeaveRequestData(data: LeaveRequestFormData): LeaveRequestFormData {
  try {
    return leaveRequestSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Validation failed: ${error.issues.map((e: any) => e.message).join(', ')}`
      throw new Error(errorMessage)
    }
    throw error
  }
}

/**
 * Prepares the leave request object for database insertion
 */
export function prepareLeaveRequestForInsert(validatedData: LeaveRequestFormData, userId: string): LeaveRequestInsert {
  return {
    user_id: userId,
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
}

/**
 * Creates FormData object from validated leave request data for server submission
 * This is the inverse operation of extractFormData/parseFormData
 */
export function createFormDataFromLeaveRequest(data: LeaveRequestFormData): FormData {
  const formData = new FormData()
  
  formData.append("leave_type_id", data.leave_type_id.toString())
  formData.append("start_date", data.start_date)
  formData.append("end_date", data.end_date || "")
  formData.append("is_half_day", data.is_half_day.toString())
  
  if (data.half_day_type) {
    formData.append("half_day_type", data.half_day_type)
  }
  
  formData.append("message", data.message)
  formData.append("emergency_contact", data.emergency_contact || "")
  formData.append("projects", JSON.stringify(data.projects))
  formData.append("current_manager_id", data.current_manager_id || "")
  formData.append("backup_id", data.backup_id || "")
  formData.append("internal_notifications", JSON.stringify(data.internal_notifications))
  formData.append("external_notifications", JSON.stringify(data.external_notifications))
  
  return formData
}

/**
 * Processes form data from raw FormData to validated and prepared data
 * This is a convenience function that combines all the formatting steps
 */
export function processLeaveRequestFormData(formData: FormData): LeaveRequestFormData {
  const rawData = extractFormData(formData)
  const parsedData = parseFormData(rawData)
  return validateLeaveRequestData(parsedData)
}