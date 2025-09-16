'use client';

import { PageContainer } from '@workspace/ui/components/page-container';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { LeaveType, ProjectForm, UserForm } from '@/types/leave-request';

export default function EditLeaveRequestPageClient({
  leaveTypes,
  projects,
  users,
  leaveRequest,
}: {
  leaveTypes: LeaveType[];
  projects: ProjectForm[];
  users: UserForm[];
  leaveRequest: Record<string, unknown>;
}) {
  return (
    <PageContainer>
      <div className='mx-auto'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold'>Edit Leave Request</h1>
          <p className='text-gray-600 mt-2'>
            Make changes to your pending leave request. All relevant parties
            will be notified of the changes.
          </p>
        </div>

        <LeaveRequestForm
          leaveTypes={leaveTypes || []}
          projects={projects || []}
          users={users || []}
          editMode={{
            isEditing: true,
            requestId: leaveRequest.id as string,
            initialData: leaveRequest as Record<string, unknown>,
          }}
        />
      </div>
    </PageContainer>
  );
}
