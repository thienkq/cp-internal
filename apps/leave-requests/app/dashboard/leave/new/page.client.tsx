'use client';

import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { PageContainer } from '@workspace/ui/components/page-container';
import { UserForm, LeaveType, ProjectForm } from '@/types/leave-request';

export default function NewLeaveRequestPageClient({
  leaveTypes,
  projects,
  users,
}: {
  leaveTypes: LeaveType[];
  projects: ProjectForm[];
  users: UserForm[];
}) {
  return (
    <PageContainer>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold tracking-tight'>Request Time Off</h1>
        <p className='text-muted-foreground'>
          Submit a new time off request for manager approval
        </p>
      </div>

      <LeaveRequestForm
        leaveTypes={leaveTypes}
        projects={projects}
        users={users}
      />
    </PageContainer>
  );
}
