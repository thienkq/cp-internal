"use client";
import { useEffect, useState } from "react";
import type { ExtendedAbsence } from "@/types";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Badge } from "@workspace/ui/components/badge";
import { Plus, Edit, Trash2, Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import ExtendedAbsenceForm from "./extended-absence-form";
import { getExtendedAbsencesByUserId, deleteExtendedAbsence } from "@/app/actions/extended-absences";

interface ExtendedAbsenceWithImpact extends ExtendedAbsence {
  durationDays: number;
  tenureImpact: number;
  isCompleted: boolean;
  isProcessed: boolean;
}

export default function ExtendedAbsenceList({ userId }: { userId: string }) {
  const [absences, setAbsences] = useState<ExtendedAbsenceWithImpact[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState<ExtendedAbsence | null>(null);

  const calculateAbsenceImpact = (absence: ExtendedAbsence): ExtendedAbsenceWithImpact => {
    const startDate = new Date(absence.start_date);
    const endDate = new Date(absence.end_date);
    const today = new Date();
    
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isCompleted = endDate <= today;
    const isProcessed = false; // This would come from the database in a real implementation
    
    // Only absences longer than 30 days affect tenure
    const tenureImpact = durationDays > 30 ? durationDays : 0;
    
    return {
      ...absence,
      durationDays,
      tenureImpact,
      isCompleted,
      isProcessed
    };
  };

  const fetchAbsences = async () => {
    setLoading(true);
    try {
      const data = await getExtendedAbsencesByUserId(userId);
      const absencesWithImpact = data.map(calculateAbsenceImpact);
      setAbsences(absencesWithImpact);
    } catch (error: any) {
      toast.error("Failed to fetch absences.", { description: error.message });
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
    const result = await deleteExtendedAbsence(absence.id);
    if (!result.success) {
      toast.error("Failed to delete absence.", { description: result.error });
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

  const getStatusBadge = (absence: ExtendedAbsenceWithImpact) => {
    if (!absence.isCompleted) {
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Future</Badge>;
    }
    if (absence.tenureImpact > 0) {
      return <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">Affects Tenure</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-50 text-gray-700 border-gray-200">No Impact</Badge>;
  };

  const getTenureImpactText = (absence: ExtendedAbsenceWithImpact) => {
    if (absence.tenureImpact === 0) {
      return "No impact (&le;30 days)";
    }
    return `+${absence.tenureImpact} days to tenure`;
  };

  const totalTenureImpact = absences.reduce((sum, absence) => sum + absence.tenureImpact, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Extended Absences</h3>
          <p className="text-sm text-gray-600">Manage periods of extended absence for this user</p>
          {totalTenureImpact > 0 && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Total tenure impact: +{totalTenureImpact} days
                </span>
              </div>
            </div>
          )}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenure Impact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {absences.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400">No extended absences found.</td>
                  </tr>
                )}
                {absences.map(absence => (
                  <tr key={absence.id} className="hover:bg-purple-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{absence.start_date}</div>
                          <div className="text-gray-500">to {absence.end_date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">{absence.durationDays} days</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {absence.tenureImpact > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                        <span className={`text-sm ${absence.tenureImpact > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {getTenureImpactText(absence)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(absence)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-600">{absence.reason || '-'}</span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-2">
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