import { getLeaveRequestServerProps } from '@/lib/get-leave-request-server-props';
import NewLeaveRequestPageClient from './page.client';

export default async function NewLeaveRequestPage() {
  // Use the cached function to fetch required data
  const { leaveTypes, projects, users } = await getLeaveRequestServerProps();

  return (
    <NewLeaveRequestPageClient
      leaveTypes={leaveTypes}
      projects={projects}
      users={users}
    />
  );
}
