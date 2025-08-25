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
  _leaveTypes: FormDataEntryValue | null
  _users: FormDataEntryValue | null
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
  cancel_reason?: string | null
  canceled_at?: string | null
}

// Enhanced interface that includes all data needed for email templates
export interface LeaveRequestWithEmailData extends LeaveRequestInsert {
  // The actual leave request ID (added after database insertion)
  id?: string
  // Email template data (to avoid database queries)
  requester_name: string
  requester_email: string
  leave_type_name: string
  manager_name: string | null
  manager_email: string | null
  backup_name: string | null
  backup_email: string | null
  internal_notification_emails: string[] | null
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
    external_notifications: formData.get("external_notifications"),
    _leaveTypes: formData.get("_leaveTypes"),
    _users: formData.get("_users")
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
 * Enriches leave request data with information needed for email templates
 */
export function enrichLeaveRequestWithEmailData(
  validatedData: LeaveRequestFormData,
  userId: string,
  leaveTypes: Array<{ id: number; name: string }>,
  users: Array<{ id: string; full_name: string; email: string }>,
  requesterName: string,
  requesterEmail: string
): LeaveRequestWithEmailData {
  const baseRequest = prepareLeaveRequestForInsert(validatedData, userId);
  
  // Find leave type name
  const leaveType = leaveTypes.find(lt => lt.id === validatedData.leave_type_id);
  
  // Find manager details
  const manager = validatedData.current_manager_id 
    ? users.find(u => u.id === validatedData.current_manager_id)
    : null;
  
  // Find backup person details
  const backup = validatedData.backup_id 
    ? users.find(u => u.id === validatedData.backup_id)
    : null;
  
  // Get internal notification emails
  const internalNotificationEmails = validatedData.internal_notifications.length > 0 
    ? validatedData.internal_notifications 
    : null;
  
  return {
    ...baseRequest,
    requester_name: requesterName,
    requester_email: requesterEmail,
    leave_type_name: leaveType?.name || 'Unknown',
    manager_name: manager?.full_name || null,
    manager_email: manager?.email || null,
    backup_name: backup?.full_name || null,
    backup_email: backup?.email || null,
    internal_notification_emails: internalNotificationEmails
  };
}

/**
 * Creates FormData object from validated leave request data for server submission
 * This includes reference data to avoid database queries in email notifications
 */
export function createFormDataFromLeaveRequest(
  data: LeaveRequestFormData,
  leaveTypes: Array<{ id: number; name: string }>,
  users: Array<{ id: string; full_name: string; email: string }>
): FormData {
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
  
  // Add reference data for email templates (to avoid database queries)
  formData.append("_leaveTypes", JSON.stringify(leaveTypes))
  formData.append("_users", JSON.stringify(users))
  
  return formData
}

/**
 * Extracts reference data from FormData for email templates
 */
export function extractReferenceData(formData: FormData): {
  leaveTypes: Array<{ id: number; name: string }>;
  users: Array<{ id: string; full_name: string; email: string }>;
} {
  const rawData = extractFormData(formData);
  
  let leaveTypes: Array<{ id: number; name: string }> = [];
  let users: Array<{ id: string; full_name: string; email: string }> = [];
  
  try {
    if (rawData._leaveTypes && typeof rawData._leaveTypes === 'string') {
      leaveTypes = JSON.parse(rawData._leaveTypes);
    }
    if (rawData._users && typeof rawData._users === 'string') {
      users = JSON.parse(rawData._users);
    }
  } catch (error) {
    console.warn('Failed to parse reference data:', error);
  }
  
  return { leaveTypes, users };
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