import { PageContainer } from '@workspace/ui/components/page-container';
import { getCurrentUser } from '@/lib/auth-utils';
import { getDb } from '@/db';
import { projectAssignments, projects } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import MyAssignmentList from '@/components/projects/my-assignment-list';

export default async function MyAssignmentsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <PageContainer>
        <div className='text-destructive'>
          User not authenticated. Please sign in.
        </div>
      </PageContainer>
    );
  }

  const userId = user.id;
  const db = getDb();

  try {
    const [assignments, allProjects] = await Promise.all([
      db
        .select()
        .from(projectAssignments)
        .where(eq(projectAssignments.user_id, userId))
        .orderBy(desc(projectAssignments.assigned_at)),
      db
        .select()
        .from(projects)
        .orderBy(projects.name),
    ]);

    return (
      <PageContainer>
        <MyAssignmentList
          userId={userId}
          initialAssignments={assignments || []}
          allProjects={allProjects || []}
        />
      </PageContainer>
    );
  } catch (error) {
    console.error('Error loading assignments:', error);
    return (
      <PageContainer>
        <div className='text-destructive'>
          Failed to load data. Please try again later.
        </div>
      </PageContainer>
    );
  }
}
