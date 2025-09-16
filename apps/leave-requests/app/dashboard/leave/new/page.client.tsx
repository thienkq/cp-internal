'use client';

import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { PageContainer } from '@workspace/ui/components/page-container';

export default function NewLeaveRequestPageClient({
  leaveTypes,
  projects,
  users,
}: {
  leaveTypes: Array<{
    id: number;
    name: string;
    description?: string | null;
    is_paid: boolean;
    supports_half_day: boolean;
    supports_carryover: boolean;
    quota: number | null;
  }>;
  projects: Array<{
    id: string;
    name: string;
  }>;
  users: Array<{
    id: string;
    full_name: string;
    email: string;
  }>;
}) {
  return (
    <PageContainer>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold tracking-tight'>New Leave Request</h1>
        <p className='text-muted-foreground'>
          Submit a new leave request for approval
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
