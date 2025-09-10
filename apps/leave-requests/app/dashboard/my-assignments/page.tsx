import { PageContainer } from '@workspace/ui/components/page-container';
import { createServerClient } from '@workspace/supabase';
import MyAssignmentList from '@/components/projects/my-assignment-list';

export default async function MyAssignmentsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userId = user?.id as string;

  const { data: assignments, error: assignmentsError } = await supabase
    .from('project_assignments')
    .select('*, project:project_id(id, name)')
    .eq('user_id', userId)
    .order('assigned_at', { ascending: false });

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  if (assignmentsError || projectsError) {
    return (
      <PageContainer>
        <div className='text-red-600'>
          Failed to load data. Please try again later.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <MyAssignmentList
        userId={userId}
        initialAssignments={assignments || []}
        allProjects={projects || []}
      />
    </PageContainer>
  );
}
