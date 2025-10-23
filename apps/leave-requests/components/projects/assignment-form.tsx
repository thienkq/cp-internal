"use client";

import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Input } from "@workspace/ui/components/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { useState, useTransition, useEffect } from "react";
import { bulkAssignUsers } from "@/app/admin/projects/[projectId]/assignments/actions";
import { toast } from "sonner";
import { MultiSelect, type MultiSelectOption } from "@/components/common/multi-select";
// TODO: Replace Supabase calls with API routes
import { assignmentRoleOptions } from "../users/user-constants";

interface AssignmentConfig {
  role: string;
  is_lead: boolean;
}

export default function AssignmentForm({ users, projectId }: { users: any[]; projectId: string }) {
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [userAssignments, setUserAssignments] = useState<Record<string, AssignmentConfig>>({});
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [submitting, startTransition] = useTransition();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Fetch current user id on mount
  useEffect(() => {
    // TODO: Replace with NextAuth client-side auth
    setLoadingUser(false);
  }, []);

  const userOptions: MultiSelectOption[] = users.map(user => ({
    value: user.id,
    label: user.full_name || user.email,
  }));

  useEffect(() => {
    setUserAssignments(current => {
      const updated: Record<string, AssignmentConfig> = {};
      selectedUserIds.forEach(id => {
        const c = current[id];
        updated[id] = {
          role: c && typeof c.role === 'string' ? c.role : 'developer',
          is_lead: c && typeof c.is_lead === 'boolean' ? c.is_lead : false,
        };
      });
      return updated;
    });
  }, [selectedUserIds]);

  const handleAssignmentChange = (userId: string, field: keyof AssignmentConfig, value: any) => {
    setUserAssignments(prev => {
      const prevConfig = prev[userId] || { role: 'developer', is_lead: false };
      return {
        ...prev,
        [userId]: {
          ...prevConfig,
          [field]: value,
        },
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || selectedUserIds.length === 0) {
      toast.warning("Please select users and a start date.");
      return;
    }
    if (!currentUserId) {
      toast.error("Could not determine current user. Please refresh and try again.");
      return;
    }
    const assignedBy = currentUserId;
    const assignments = selectedUserIds
      .map(user_id => {
        const config = userAssignments[user_id];
        if (!config || typeof config.role !== 'string' || typeof config.is_lead !== 'boolean') return null;
        return {
          user_id,
          start_date: startDate,
          end_date: endDate,
          ...config,
        };
      })
      .filter(Boolean) as Array<{
        user_id: string;
        role: string;
        is_lead: boolean;
        start_date: string;
        end_date?: string;
      }>;
    if (assignments.length === 0) return;
    startTransition(async () => {
      const res = await bulkAssignUsers({ projectId, assignments, assignedBy });
      if (res.success) {
        toast.success("Assignments created successfully");
        setSelectedUserIds([]);
      } else {
        toast.error("Failed to create assignments", { description: res.error });
      }
    });
  };

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="block font-medium">Select Users</label>
        <MultiSelect
          options={userOptions}
          selected={selectedUserIds}
          onChange={setSelectedUserIds}
          placeholder="Select users to assign..."
        />
      </div>
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block font-medium mb-1">Start Date *</label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
        </div>
        <div>
          <label className="block font-medium mb-1">End Date</label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>
      {selectedUserIds.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Assignment Preview & Edit</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left border">User</th>
                  <th className="px-3 py-2 text-left border">Role</th>
                  <th className="px-3 py-2 text-center border">Lead</th>
                  <th className="px-3 py-2 text-left border">Start Date</th>
                  <th className="px-3 py-2 text-left border">End Date</th>
                </tr>
              </thead>
              <tbody>
                {selectedUserIds.map(userId => {
                  const user = userOptions.find(u => u.value === userId);
                  const config = userAssignments[userId];
                  if (!config) return null;
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                      <td className="px-3 py-2 border">{user?.label || userId}</td>
                      <td className="px-3 py-2 border">
                        <Select value={config.role} onValueChange={val => handleAssignmentChange(userId, "role", val)}>
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {assignmentRoleOptions.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-3 py-2 border text-center">
                        <Checkbox checked={config.is_lead} onCheckedChange={val => handleAssignmentChange(userId, "is_lead", !!val)} />
                      </td>
                      <td className="px-3 py-2 border">
                        {startDate}
                      </td>
                      <td className="px-3 py-2 border">
                        {endDate}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Button type="submit" disabled={selectedUserIds.length === 0 || submitting}>
        {submitting ? "Assigning..." : "Assign Users"}
      </Button>
    </form>
  );
} 