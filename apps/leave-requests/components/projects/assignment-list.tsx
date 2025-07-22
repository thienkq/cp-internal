"use client";
import { useEffect, useState, useMemo } from "react";
import { createBrowserClient } from "@workspace/supabase";
import { DataTable } from "../common/data-table";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { assignmentRoleOptions, assignmentStatusOptions } from "../users/user-constants";

export default function AssignmentList({ projectId}: { projectId: string}) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editAssignment, setEditAssignment] = useState<any | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchAssignments() {
      setLoading(true);
      setError(null);
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("project_assignments")
        .select("*, user:user_id(id, full_name, email)")
        .eq("project_id", projectId)
        .order("assigned_at", { ascending: false });
      if (error) {
        setError(error.message);
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    }
    fetchAssignments();
  }, [projectId]);

  const columns = useMemo(() => [
    {
      header: "User",
      accessorKey: "user.full_name",
      cell: ({ row }: any) => row.original.user?.full_name || row.original.user?.email,
    },
    {
      header: "Role",
      accessorKey: "role",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.role}</Badge>,
    },
    {
      header: "Lead",
      accessorKey: "is_lead",
      cell: ({ row }: any) => row.original.is_lead ? <Badge variant="secondary">Lead</Badge> : null,
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === "active" ? "default" : "secondary"}>
          {row.original.status.charAt(0).toUpperCase() + row.original.status.slice(1)}
        </Badge>
      ),
    },
    {
      header: "Start",
      accessorKey: "start_date",
      cell: ({ row }: any) => row.original.start_date,
    },
    {
      header: "End",
      accessorKey: "end_date",
      cell: ({ row }: any) => row.original.end_date || "-",
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <Button size="sm" variant="outline" onClick={() => {
          setEditAssignment(row.original);
          setEditValues({
            status: row.original.status,
            start_date: row.original.start_date,
            end_date: row.original.end_date || "",
          });
        }}>
          Edit
        </Button>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], []);

  // Edit modal logic
  const handleEditChange = (field: string, value: string) => {
    setEditValues((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!editAssignment) return;
    setSaving(true);
    const supabase = createBrowserClient();
    const { error } = await supabase
      .from("project_assignments")
      .update({
        status: editValues.status,
        start_date: editValues.start_date,
        end_date: editValues.end_date || null,
      })
      .eq("id", editAssignment.id);
    setSaving(false);
    setEditAssignment(null);
    setEditValues({});
    if (!error) {
      // Refresh assignments
      const { data } = await supabase
        .from("project_assignments")
        .select("*, user:user_id(id, full_name, email)")
        .eq("project_id", projectId)
        .order("assigned_at", { ascending: false });
      setAssignments(data || []);
    } else {
      alert("Failed to update assignment: " + error.message);
    }
  };

  if (loading) return <div>Loading assignments...</div>;
  if (error) return <div className="text-red-600">Failed to load assignments: {error}</div>;

  return (
    <div>
      <DataTable
        data={assignments}
        columns={columns}
        searchField={{ key: "user.full_name", placeholder: "Search user..." }}
        filters={[
          {
            columnKey: "role",
            title: "Role",
            options: assignmentRoleOptions,
          },
          {
            columnKey: "status",
            title: "Status",
            options: assignmentStatusOptions,
          },
        ]}
      />
      <Dialog open={!!editAssignment} onOpenChange={open => { if (!open) setEditAssignment(null); }}>
        <DialogContent>
          <DialogTitle>Edit Assignment</DialogTitle>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Status</label>
              <Select value={editValues.status} onValueChange={val => handleEditChange("status", val)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block font-medium mb-1">Start Date</label>
              <Input type="date" value={editValues.start_date || ""} onChange={e => handleEditChange("start_date", e.target.value)} />
            </div>
            <div>
              <label className="block font-medium mb-1">End Date</label>
              <Input type="date" value={editValues.end_date || ""} onChange={e => handleEditChange("end_date", e.target.value)} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditAssignment(null)} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 