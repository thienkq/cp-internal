import { LeaveRequestForm } from "@/components/leave/leave-request-form"
import { requireAuth } from "@workspace/supabase"
import { PageContainer } from "@workspace/ui/components/page-container"
import { redirect } from "next/navigation"

export default async function NewLeaveRequestPage() {
  try {
    const { user, supabase } = await requireAuth()
    
    // Fetch required data for the form
    const [leaveTypesResult, projectsResult, usersResult] = await Promise.all([
      supabase.from('leave_types').select('*').order('name'),
      supabase.from('projects').select('id, name').order('name'), 
      supabase.from('users').select('id, full_name, email').order('full_name')
    ])

    const leaveTypes = leaveTypesResult.data || []
    const projects = projectsResult.data || []
    const users = usersResult.data || []

    return (
      <PageContainer>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">New Leave Request</h1>
          <p className="text-muted-foreground">
            Submit a new leave request for approval
          </p>
        </div>
        
        <LeaveRequestForm 
          leaveTypes={leaveTypes}
          projects={projects}
          users={users}
          currentUser={{ id: user.id, email: user.email ?? "" }}
        />
      </PageContainer>
    )
  } catch (error) {
    redirect('/auth/login')
  }
} 