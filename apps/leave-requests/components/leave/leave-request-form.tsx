"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"

import { submitLeaveRequest } from "@/app/dashboard/leave/new/actions"
import { leaveRequestSchema, type LeaveRequestFormData } from "@/lib/leave-request-schema"
import { createFormDataFromLeaveRequest } from "@/lib/leave-request-form-utils"

import { Button } from "@workspace/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@workspace/ui/components/form"
import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select"
import { Checkbox } from "@workspace/ui/components/checkbox"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { Alert, AlertDescription } from "@workspace/ui/components/alert"
import { Calendar, FileText, Users, Mail, Info, X, Plus } from "lucide-react"

import { ProjectMultiSelect } from "@/components/leave/project-multi-select"
import { UserMultiSelect } from "@/components/leave/user-multi-select"

interface LeaveRequestFormProps {
  leaveTypes: Array<{
    id: number
    name: string
    description: string
    is_paid: boolean
    supports_half_day: boolean
    supports_carryover: boolean
    quota: number | null
  }>
  projects: Array<{
    id: string
    name: string
  }>
  users: Array<{
    id: string
    full_name: string
    email: string
  }>
}

export function LeaveRequestForm({ leaveTypes, projects, users }: LeaveRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [externalEmailInput, setExternalEmailInput] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leave_type_id: 0,
      start_date: "",
      end_date: null,
      is_half_day: false,
      half_day_type: null,
      message: "",
      emergency_contact: null,
      projects: [],
      current_manager_id: null,
      backup_id: null,
      internal_notifications: [],
      external_notifications: []
    }
  })

  const isHalfDay = form.watch("is_half_day")
  const selectedLeaveTypeId = form.watch("leave_type_id")
  const selectedLeaveType = leaveTypes.find(lt => lt.id === selectedLeaveTypeId)
  const externalNotifications = form.watch("external_notifications")

  const addExternalEmail = () => {
    const email = externalEmailInput.trim()
    if (email && !externalNotifications.includes(email)) {
      form.setValue("external_notifications", [...externalNotifications, email])
      setExternalEmailInput("")
    }
  }

  const removeExternalEmail = (email: string) => {
    form.setValue("external_notifications", externalNotifications.filter(e => e !== email))
  }

  const onSubmit = async (data: LeaveRequestFormData) => {
    setIsSubmitting(true)
    setSubmitError(null) // Clear any previous errors
    
    try {
      // Create FormData for server action using utility function
      const formData = createFormDataFromLeaveRequest(data)
      const result = await submitLeaveRequest(formData)
      
      if (result.success) {
        // Redirect on success using client-side navigation
        router.push(result.redirectTo || '/dashboard')
      } else {
        // Handle server-side error
        setSubmitError(result.error || 'An unexpected error occurred')
      }
    } catch (error) {
      console.error('Error submitting leave request:', error)
      
      // Extract meaningful error message for the user
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while submitting your leave request. Please try again.'
      
      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Leave Details */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <CardTitle>Leave Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leave_type_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Leave Type</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {leaveTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{type.name}</span>
                              <Badge variant={type.is_paid ? "green" : "secondary"} className="text-xs">
                                {type.is_paid ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {selectedLeaveType && (
                      <div className="mt-1 text-xs text-muted-foreground italic">
                        {selectedLeaveType.description}
                      </div>
                    )}
                  </FormItem>
                )}
              />

              {/* Half Day Option */}
              {selectedLeaveType?.supports_half_day && (
                <FormField
                  control={form.control}
                  name="is_half_day"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (!checked) {
                              form.setValue("half_day_type", null)
                            }
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Half Day Request</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Half Day Type */}
              {isHalfDay && (
                <FormField
                  control={form.control}
                  name="half_day_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Half Day Period</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="afternoon">Afternoon</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Date Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isHalfDay && (
                  <FormField
                    control={form.control}
                    name="end_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} value={field.value ?? ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Reason */}
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please provide details about your leave request..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Emergency Contact */}
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Phone number or contact info" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Right Column - Projects & Notifications */}
          <div className="space-y-6">
            {/* Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  <CardTitle>Projects</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="projects"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ProjectMultiSelect
                          projects={projects}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Approvals & Notifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <CardTitle>Approvals & Notifications</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Manager */}
                <FormField
                  control={form.control}
                  name="current_manager_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager for Approval</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select your manager" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Backup */}
                <FormField
                  control={form.control}
                  name="backup_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Backup Person (Optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? ""}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select backup person" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map(user => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.full_name || user.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Internal Notifications */}
                <FormField
                  control={form.control}
                  name="internal_notifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notifications (Optional)</FormLabel>
                      <FormControl>
                        <UserMultiSelect
                          users={users}
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription>
                        Select internal users to notify about your leave
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* External Notifications */}
                <div className="space-y-2">
                  <FormLabel>External Email Notifications (Optional)</FormLabel>
                  <div className="flex gap-2">
                    <Input
                      placeholder="client@company.com"
                      value={externalEmailInput}
                      onChange={(e) => setExternalEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addExternalEmail()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addExternalEmail}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {externalNotifications.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {externalNotifications.map((email) => (
                        <Badge key={email} variant="secondary" className="gap-1">
                          {email}
                          <button
                            type="button"
                            onClick={() => removeExternalEmail(email)}
                            className="hover:bg-destructive hover:text-destructive-foreground rounded-full"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Add external emails (e.g., client managers) to notify about your leave
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Error Display */}
        {submitError && (
          <Alert variant="destructive">
            <AlertDescription>
              {submitError}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
            variant="blue"
          >
            {isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 