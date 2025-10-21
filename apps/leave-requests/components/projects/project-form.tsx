"use client";
import { useForm } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { toast } from "sonner";
import { useEffect } from "react";
import { Project } from "@/types";
import { createProject, updateProject } from "@/app/actions/projects";

export type ProjectFormValues = {
  name: string;
  is_billable: boolean;
  is_active: boolean;
};

type ProjectFormProps = {
  initialData: Project | null;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function ProjectForm({ initialData, onSuccess, onCancel }: ProjectFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting }, reset } = useForm<ProjectFormValues>({
    defaultValues: {
      name: "",
      is_billable: true,
      is_active: true,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || "",
        is_billable: initialData.is_billable ?? true,
        is_active: initialData.is_active ?? true,
      });
    } else {
      reset({
        name: "",
        is_billable: true,
        is_active: true,
      });
    }
  }, [initialData, reset]);

  const onSubmit = async (data: ProjectFormValues) => {
    let result;
    if (initialData) {
      result = await updateProject(initialData.id, data);
    } else {
      result = await createProject(data);
    }
    if (!result.success) {
      toast.error("Failed to save project.", { description: result.error });
      return;
    }
    toast.success("Project saved successfully!");
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label className="mb-2">Project Name *</Label>
        <Input {...register("name", { required: "Project name is required" })} />
        {errors.name && <div className="text-red-600 text-sm mt-1">{errors.name.message}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" {...register("is_billable")} id="is_billable" />
        <Label htmlFor="is_billable">Billable</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={watch("is_active")} onCheckedChange={val => setValue("is_active", val)} id="is_active" />
        <Label htmlFor="is_active">Active</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save"}</Button>
      </div>
    </form>
  );
} 