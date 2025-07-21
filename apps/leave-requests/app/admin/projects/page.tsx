import { createServerClient } from "@workspace/supabase";
import { PageContainer } from "@workspace/ui/components/page-container";
import ProjectsClient from "@/components/projects/projects-view-page";

export default async function AdminProjectsPage() {
  const supabase = await createServerClient();
  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return <div className="text-red-600">Failed to load projects. Please try again later.</div>;
  }

  return (
    <PageContainer>
      <ProjectsClient initialProjects={projects || []} />
    </PageContainer>
  );
} 