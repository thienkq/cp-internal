"use client";
import { useEffect, useState } from "react";
import type { ExtendedAbsence } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { createBrowserClient } from "@workspace/supabase";
import { toast } from "sonner";
import ExtendedAbsenceForm from "./extended-absence-form";

export default function ExtendedAbsenceList({ userId }: { userId: string }) {
  const [absences, setAbsences] = useState<ExtendedAbsence[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<ExtendedAbsence | null>(null);

  const fetchAbsences = async () => {
    setLoading(true);
    const supabase = createBrowserClient();
    const { data, error } = await supabase.from("extended_absences").select("*").eq("user_id", userId).order("start_date", { ascending: false });
    if (error) {
      toast.error("Failed to fetch absences.", { description: error.message });
    } else {
      setAbsences(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAbsences();
    // eslint-disable-next-line
  }, [userId]);

  const handleAdd = () => {
    setEditingAbsence(null);
    setOpen(true);
  };
  const handleEdit = (absence: ExtendedAbsence) => {
    setEditingAbsence(absence);
    setOpen(true);
  };
  const handleDelete = async (absence: ExtendedAbsence) => {
    if (!window.confirm("Are you sure you want to delete this extended absence?")) return;
    setLoading(true);
    const supabase = createBrowserClient();
    const { error } = await supabase.from("extended_absences").delete().eq("id", absence.id);
    if (error) {
      toast.error("Failed to delete absence.", { description: error.message });
    } else {
      toast.success("Absence deleted.");
      await fetchAbsences();
    }
    setLoading(false);
  };
  const handleSuccess = async () => {
    setOpen(false);
    await fetchAbsences();
  };
  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Extended Absences</h3>
          <p className="text-sm text-gray-600">Manage periods of extended absence for this user</p>
        </div>
        <Button onClick={handleAdd} disabled={loading} className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
          <Plus className="h-4 w-4 mr-2" />
          Add Absence
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {absences.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">No extended absences found.</td>
                  </tr>
                )}
                {absences.map(absence => (
                  <tr key={absence.id} className="hover:bg-purple-50">
                    <td className="px-4 py-2 whitespace-nowrap">{absence.start_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{absence.end_date}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{absence.reason || '-'}</td>
                    <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(absence)} className="flex items-center gap-1 hover:bg-purple-50 hover:border-purple-300"><Edit className="h-3 w-3" />Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(absence)} className="flex items-center gap-1 hover:bg-red-50 hover:border-red-300 hover:text-red-600"><Trash2 className="h-3 w-3" />Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <span style={{ display: "none" }} />
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <ExtendedAbsenceForm
            userId={userId}
            absence={editingAbsence}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
} 