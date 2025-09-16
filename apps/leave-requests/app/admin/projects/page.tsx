import { PageContainer } from "@workspace/ui/components/page-container";
import ProjectsClient from "@/components/projects/projects-view-page";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { desc } from "drizzle-orm";

export default async function AdminProjectsPage() {
  const db = getDb();
  
  let projectsData = [];
  try {
    const result = await db
      .select()
      .from(projects)
      .orderBy(desc(projects.created_at));
    
    // Transform the data to match the expected Project type
    projectsData = result.map(project => ({
      id: project.id,
      name: project.name,
      is_billable: project.is_billable,
      is_active: project.is_active,
      created_at: project.created_at || undefined,
      updated_at: project.updated_at || undefined,
    }));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return <div className="text-red-600">Failed to load projects. Please try again later.</div>;
  }

  return (
    <PageContainer>
      <ProjectsClient initialProjects={projectsData} />
    </PageContainer>
  );
} 