import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import { assignmentRoleOptions } from "@/components/users/user-constants";
import { Badge } from "@workspace/ui/components/badge";

export default function UserAssignmentForm({
  initial, projects = [], onSave, onCancel, loading
}: {
  initial?: any;
  projects?: { id: string; name: string }[];
  onSave: (values: any) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState(() => initial || {
    project_id: "",
    role: assignmentRoleOptions[0]?.value ?? "",
    status: "active",
    start_date: "",
    end_date: "",
    is_lead: false,
  });
  return (
    <form
      className="bg-white border-l-4 border-blue-500 rounded-xl shadow-lg p-8 mb-6 flex flex-col gap-8 transition hover:shadow-xl"
      onSubmit={e => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <div className="font-semibold text-xl mb-2 text-blue-700">Assignment Details</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Label className="mb-1">Project Name</Label>
          <Select value={form.project_id} onValueChange={v => setForm((f: typeof form) => ({ ...f, project_id: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {(projects ?? []).map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1">Position</Label>
          <Select value={form.role} onValueChange={v => setForm((f: typeof form) => ({ ...f, role: v }))}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              {assignmentRoleOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-1">Start Date</Label>
          <Input type="date" value={form.start_date} onChange={e => setForm((f: typeof form) => ({ ...f, start_date: e.target.value }))} />
        </div>
        <div>
          <Label className="mb-1">End Date</Label>
          <Input type="date" value={form.end_date} onChange={e => setForm((f: typeof form) => ({ ...f, end_date: e.target.value }))} />
        </div>
      </div>
      <div className="flex flex-wrap gap-8 items-center mt-2">
        <div className="flex items-center gap-2">
          <Switch checked={form.is_lead} onCheckedChange={val => setForm((f: typeof form) => ({ ...f, is_lead: val }))} id="is_lead" className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-200" />
          <Label htmlFor="is_lead" className="text-blue-700 font-medium">Manager</Label>
        </div>
        {isEdit && (
          <div className="flex items-center gap-2">
            <Switch checked={form.status === "active"} onCheckedChange={val => setForm((f: typeof form) => ({ ...f, status: val ? "active" : "inactive" }))} id="active_status" className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200" />
            <Label htmlFor="active_status" className="text-green-700 font-medium">Active</Label>
          </div>
        )}
      </div>
      <div className="flex gap-2 justify-end mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>Cancel</Button>
        <Button type="submit" variant="blue" disabled={loading}>{loading ? "Saving..." : "Save Assignment"}</Button>
      </div>
    </form>
  );
} 