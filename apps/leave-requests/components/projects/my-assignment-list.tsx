"use client";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Edit, Trash2, Briefcase, Calendar } from "lucide-react";
import UserAssignmentForm from "./user-assignment-form";
import { useState as useReactState } from "react";

export default function MyAssignmentList({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useReactState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useReactState(false);

  useEffect(() => {
    if (!userId) return;
    async function fetchAll() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserClient();
      const [{ data: assignmentsData, error: aErr }, { data: projectsData, error: pErr }] = await Promise.all([
        supabase
          .from("project_assignments")
          .select("*, project:project_id(id, name)")
          .eq("user_id", userId)
          .order("assigned_at", { ascending: false }),
        supabase
          .from("projects")
          .select("id, name")
          .order("name", { ascending: true })
      ]);
      if (aErr || pErr) {
        setError(aErr?.message || pErr?.message || "Failed to load data");
      } else {
        setAssignments(assignmentsData || []);
        setProjects(projectsData || []);
      }
      setLoading(false);
    }
    fetchAll();
  }, [userId]);

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

  if (loading) return <div>Loading assignments...</div>;
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
                className="flex items-center justify-between bg-white rounded-lg border p-6 shadow-sm"
              >
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center justify-center">
                    <Briefcase className="w-10 h-10 text-blue-400 mb-2" />
                  </div>
                  <div>
                    <div className="font-bold text-xl text-blue-900 flex items-center gap-2">
                      {a.project?.name}
                      <Badge variant={a.status === "active" ? "green" : "blue"} className="ml-2">
                        {a.status === "active" ? "Active" : "Completed"}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-base font-medium capitalize mt-1">{a.role}</div>
                    <div className="flex items-center gap-2 text-sm mt-2 text-blue-700">
                      <Calendar className="w-4 h-4" />
                      {a.start_date} → {a.end_date ? a.end_date : "Present"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => { setEditId(a.id); setAddMode(false); }}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => setDeleteId(a.id)} disabled={deleteLoading}>
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
              <Button variant="destructive" onClick={() => handleDelete(deleteId)} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 