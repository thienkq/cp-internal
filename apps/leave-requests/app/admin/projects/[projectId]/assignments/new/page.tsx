import { requireAuth } from "@/lib/auth-server-utils";
import { PageContainer } from "@workspace/ui/components/page-container";
import { notFound } from "next/navigation";
import AssignmentForm from "@/components/projects/assignment-form";

export default async function ProjectAssignmentNewPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireAuth();
  const { projectId } = await params;

  // TODO: Fetch project using Drizzle
  const project = null;
  const projectError = null;

  if (projectError || !project) {
    notFound();
  }

  // TODO: Fetch users using Drizzle
  const users: any[] = [];

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Add Assignment for Project</h1>
      <div className="bg-white rounded shadow p-4">
        <AssignmentForm users={users} projectId={projectId} />
      </div>
    </PageContainer>
  );
} 