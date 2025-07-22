"use client";
import { useState } from "react";
import { createBrowserClient } from "@workspace/supabase";
import ProjectTable from "@/components/projects/project-table";
import ProjectForm from "@/components/projects/project-form";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { Project } from "@/types";
import { useRouter } from "next/navigation";

interface ProjectsClientProps {
  initialProjects: Project[];
}

export default function ProjectsClient({ initialProjects }: ProjectsClientProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const router = useRouter();

  const fetchProjects = async () => {
    const supabase = createBrowserClient();
    const { data } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    setProjects(data || []);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setDialogOpen(true);
  };

  const handleToggleActive = async (project: Project, value: boolean) => {
    const supabase = createBrowserClient();
    const { error } = await supabase.from("projects").update({ is_active: value }).eq("id", project.id);
    if (error) {
      toast.error("Failed to update project");
    } else {
      toast.success("Project updated");
      fetchProjects();
    }
  };

  const handleSuccess = () => {
    setDialogOpen(false);
    setEditingProject(null);
    fetchProjects();
  };

  const handleAdd = () => {
    setEditingProject(null);
    setDialogOpen(true);
  };

  const handleAssign = (project: Project) => {
    router.push(`/admin/projects/${project.id}/assignments/new`);
  };

  const handleViewAssignments = (project: Project) => {
    router.push(`/admin/projects/${project.id}/assignments`);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Projects</h2>
        <Button onClick={handleAdd}>Add Project</Button>
      </div>
      <ProjectTable 
        data={projects} 
        onEdit={handleEdit} 
        onToggleActive={handleToggleActive}
        onAssign={handleAssign}
        onViewAssignments={handleViewAssignments}
      />
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>{editingProject ? "Edit Project" : "Add Project"}</DialogTitle>
          <ProjectForm
            initialData={editingProject}
            onSuccess={handleSuccess}
            onCancel={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 