import { requireAuth } from "@/lib/auth-server-utils";
import { PageContainer } from "@workspace/ui/components/page-container";
import { notFound } from "next/navigation";
import AssignmentList from "@/components/projects/assignment-list";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";

export default async function ProjectAssignmentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  await requireAuth();
  const { projectId } = await params;

  // TODO: Fetch project using Drizzle
  const project = null;
  const projectError = null;

  if (projectError || !project) {
    notFound();
  }

  return (
    <PageContainer>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Assignments for Project</h1>
        <Button asChild>
          <Link href={`/admin/projects/${projectId}/assignments/new`}>
            Add Assignment
          </Link>
        </Button>
      </div>
      <AssignmentList projectId={projectId} />
    </PageContainer>
  );
} 