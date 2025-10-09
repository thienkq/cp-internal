import { z } from "zod"
import { format, isAfter, parseISO } from "date-fns"

// Shared validation schema for leave requests
// This ensures client and server validation are identical
export const leaveRequestSchema = z.object({
  leave_type_id: z.number().min(1, "Please select a leave type"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().nullable(), // allow null for half-day
  is_half_day: z.boolean(),        // required
  half_day_type: z.enum(["morning", "afternoon"]).nullable(), // allow null
  message: z.string().min(10, "Please provide a reason (at least 10 characters)"),
  emergency_contact: z.string().nullable(),
  projects: z.array(z.object({
    id: z.string().nullable(),
    name: z.string()
  })).min(1, "Please select at least one project"),
  current_manager_id: z.string().min(1, "Please select a manager for approval"),
  backup_id: z.string().nullable(),
  internal_notifications: z.array(z.string()),
  external_notifications: z.array(z.string())
}).refine((data) => {
  // End date must be after start date (for full day requests)
  if (!data.is_half_day && data.end_date) {
    const startDate = parseISO(data.start_date)
    const endDate = parseISO(data.end_date)
    
    return isAfter(endDate, startDate) || format(endDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
  }
  return true
}, {
  message: "End date must be on or after start date",
  path: ["end_date"]
}).refine((data) => {
  if (!data.is_half_day && !data.end_date) {
    return false
  }
  return true
}, {
  message: "End date is required for full day requests",
  path: ["end_date"]
}).refine((data) => {
  if (data.is_half_day && !data.half_day_type) {
    return false
  }
  return true
}, {
  message: "Please select morning or afternoon for half day requests",
  path: ["half_day_type"]
})

export type LeaveRequestFormData = z.infer<typeof leaveRequestSchema> 