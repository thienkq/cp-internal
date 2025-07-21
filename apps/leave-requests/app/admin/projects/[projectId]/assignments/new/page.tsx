import { createServerClient } from "@workspace/supabase";
import { PageContainer } from "@workspace/ui/components/page-container";
import { notFound } from "next/navigation";
import AssignmentForm from "@/components/projects/assignment-form";

export default async function ProjectAssignmentNewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const supabase = await createServerClient();
  const { projectId } = await params;

  // Fetch project
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    notFound();
  }

  // Fetch users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .order("full_name", { ascending: true });

  if (usersError) {
    return <div className="text-red-600">Failed to load users.</div>;
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold mb-4">Add Assignment for {project.name}</h1>
      <div className="bg-white rounded shadow p-4">
        <AssignmentForm users={users} projectId={projectId} />
      </div>
    </PageContainer>
  );
} 