"use client";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { assignmentRoleOptions, assignmentStatusOptions } from "@/components/users/user-constants";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Briefcase, Calendar } from "lucide-react";

function AssignmentForm({
  initial, projects = [], onSave, onCancel, loading
}: {
  initial?: any;
  projects?: { id: string; name: string }[];
  onSave: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const safeProjects = projects;
  const [form, setForm] = useState(() => initial || {
    project_id: "",
    role: assignmentRoleOptions[0]?.value ?? "",
    status: assignmentStatusOptions[0]?.value ?? "",
    start_date: "",
    end_date: "",
    is_lead: false,
  });
  return (
    <form
      className="bg-gray-50 rounded-lg p-6 mb-6 flex flex-col gap-4"
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block font-medium mb-1">Project Name</label>
          <Select value={form.project_id} onValueChange={v => setForm((f: typeof form) => ({ ...f, project_id: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {(safeProjects ?? []).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block font-medium mb-1">Role</label>
          <Select value={form.role} onValueChange={v => setForm((f: typeof form) => ({ ...f, role: v }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignmentRoleOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block font-medium mb-1">Start Date</label>
          <Input type="date" value={form.start_date} onChange={e => setForm((f: typeof form) => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <label className="block font-medium mb-1">End Date</label>
          <Input type="date" value={form.end_date} onChange={e => setForm((f: typeof form) => ({ ...f, end_date: e.target.value }))} />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={form.is_lead} onChange={e => setForm((f: typeof form) => ({ ...f, is_lead: e.target.checked }))} />
          <span>This is a lead role</span>
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Select value={form.status} onValueChange={v => setForm((f: typeof form) => ({ ...f, status: v }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {assignmentStatusOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Save Assignment"}</Button>
      </div>
    </form>
  );
}

export default function MyAssignmentList({ userId }: { userId: string }) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [addMode, setAddMode] = useState(false);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

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
      const matchesSearch =
        !search ||
        a.project?.name?.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || roleFilter === "all" || a.role === roleFilter;
      const matchesStatus = !statusFilter || statusFilter === "all" || a.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [assignments, search, roleFilter, statusFilter]);

  // Add or edit assignment
  const handleSave = async (values: any, id?: string) => {
    setEditLoading(true);
    const supabase = createBrowserClient();
    let error;
    if (id) {
      // Edit
      ({ error } = await supabase
        .from("project_assignments")
        .update({
          ...values,
        })
        .eq("id", id));
    } else {
      // Add
      ({ error } = await supabase
        .from("project_assignments")
        .insert([{ ...values, user_id: userId }])
      );
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

  if (loading) return <div>Loading assignments...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Project Assignments</h1>
        {!addMode && <Button onClick={() => setAddMode(true)}>Add Assignment</Button>}
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        <Input
          placeholder="Search project..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64"
        />
        <Select value={roleFilter} onValueChange={val => setRoleFilter(val === "all" ? "" : val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {assignmentRoleOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={val => setStatusFilter(val === "all" ? "" : val)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {assignmentStatusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {addMode && (
        <AssignmentForm
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
              <AssignmentForm
                key={a.id}
                initial={a}
                projects={projects}
                onSave={vals => handleSave(vals, a.id)}
                onCancel={() => setEditId(null)}
                loading={editLoading}
              />
            ) : (
              <div key={a.id} className="flex items-center justify-between bg-white rounded-lg border p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <Briefcase className="w-10 h-10 text-muted-foreground" />
                  <div>
                    <div className="font-bold text-lg">{a.project?.name}</div>
                    <div className="text-muted-foreground text-sm">{a.role}</div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <Calendar className="w-4 h-4" />
                      {a.start_date} → {a.end_date ? a.end_date : "Present"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === "active" ? "default" : "secondary"}>
                    {a.status === "active" ? "Active" : "Completed"}
                  </Badge>
                  <Button size="icon" variant="ghost" onClick={() => setEditId(a.id)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => {/* handle delete */}}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
} 