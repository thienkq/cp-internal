"use client";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Edit, Trash2, Briefcase, Calendar } from "lucide-react";
import UserAssignmentForm from "./user-assignment-form";
import { useState as useReactState } from "react";
import { assignmentRoleOptions } from "@/components/users/user-constants";
import { LoadingSpinner } from "../common/loading-spinner";

export default function MyAssignmentList({
  userId,
  initialAssignments,
  allProjects,
}: {
  userId: string;
  initialAssignments: any[];
  allProjects: { id: string; name: string }[];
}) {
  const [assignments, setAssignments] = useState<any[]>(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>(allProjects);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useReactState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useReactState(false);

  // Filter and search logic
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a: any) => {
      return !search || a.project?.name?.toLowerCase().includes(search.toLowerCase());
    });
  }, [assignments, search]);

  // Add or edit assignment
  const handleSave = async (values: any, id?: string) => {
    setEditLoading(true);
    const supabase = createBrowserClient();
    // Always send null for end_date if blank
    // Remove 'project' field if present
    const { project, ...rest } = values;
    const valuesToSave = {
      ...rest,
      end_date: values.end_date ? values.end_date : null,
    };
    let error;
    if (id) {
      // Edit
      ({ error } = await supabase
        .from("project_assignments")
        .update(valuesToSave)
        .eq("id", id));
      setAddMode(false); // Close add form if editing
    } else {
      // Add
      ({ error } = await supabase
        .from("project_assignments")
        .insert([{ ...valuesToSave, user_id: userId }])
      );
      setEditId(null); // Close edit form if adding
    }
    setEditLoading(false);
    setAddMode(false);
    setEditId(null);
    if (!error) {
      // Refresh assignments
      const { data } = await supabase
        .from("project_assignments")
        .select("*, project:project_id(id, name)")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false });
      setAssignments(data || []);
    } else {
      alert("Failed to save assignment: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("project_assignments").delete().eq("id", id);
    setDeleteLoading(false);
    setDeleteId(null);
    if (!error) {
      // Refresh assignments
      const { data } = await supabase
        .from("project_assignments")
        .select("*, project:project_id(id, name)")
        .eq("user_id", userId)
        .order("assigned_at", { ascending: false });
      setAssignments(data || []);
    } else {
      alert("Failed to delete assignment: " + error.message);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><LoadingSpinner size="lg" /></div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Project Assignments</h1>
        <Button
          variant="blue"
          onClick={() => {
            setEditId(null); // Close edit form if open
            setAddMode(true); // Open add form
          }}
        >
          Add Assignment
        </Button>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Input
          placeholder="Search project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
      </div>
      {addMode && !editId && (
        <UserAssignmentForm
          projects={projects}
          onSave={vals => handleSave(vals)}
          onCancel={() => setAddMode(false)}
          loading={editLoading}
        />
      )}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <div className="text-muted-foreground">No assignments found.</div>
        ) : (
          filteredAssignments.map(a =>
            editId === a.id ? (
              <UserAssignmentForm
                key={a.id}
                initial={a}
                projects={projects}
                onSave={vals => handleSave(vals, a.id)}
                onCancel={() => setEditId(null)}
                loading={editLoading}
              />
            ) : (
              <div
                key={a.id}
                className="flex items-start justify-between bg-white rounded-lg border p-6 shadow-sm gap-4"
              >
                <div className="flex items-start gap-4 flex-grow">
                  <Briefcase className="w-8 h-8 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Project</p>
                        <h3 className="font-bold text-lg text-blue-900 mb-2">{a.project?.name}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant={a.is_lead ? 'blue' : 'outline'} className="py-1 px-2.5 text-sm font-semibold">
                            {a.is_lead ? 'Manager' : 'Team Member'}
                          </Badge>
                          <Badge variant={a.status === 'active' ? 'green' : 'secondary'} className="py-1 px-2.5 text-sm font-semibold">
                            {a.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mt-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Position</p>
                        <p className="font-medium capitalize">
                          {assignmentRoleOptions.find(o => o.value === a.role)?.label || a.role}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Duration</p>
                        <p className="font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{a.start_date} → {a.end_date ? a.end_date : 'Present'}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2 self-start">
                  <Button size="sm" variant="ghost" onClick={() => { setEditId(a.id); setAddMode(false); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteId(a.id)} disabled={deleteLoading}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          )
        )}
      </div>
      {/* Delete confirm dialog */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm">
            <div className="font-bold text-lg mb-2">Delete Assignment?</div>
            <div className="mb-4 text-muted-foreground">Are you sure you want to delete this assignment? This action cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Cancel</Button>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteId && handleDelete(deleteId)} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 