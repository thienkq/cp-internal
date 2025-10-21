"use client";
import { useForm } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { toast } from "sonner";
import type { ExtendedAbsence } from "@/types";
import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, Calendar } from "lucide-react";
import { createExtendedAbsence, updateExtendedAbsence } from "@/app/actions/extended-absences";

export type ExtendedAbsenceFormValues = {
  start_date: string;
  end_date: string;
  reason?: string;
};

type ExtendedAbsenceFormProps = {
  userId: string;
  absence: ExtendedAbsence | null;
  onSuccess: () => void;
  onCancel: () => void;
};

interface TenureImpact {
  durationDays: number;
  tenureImpact: number;
  isCompleted: boolean;
  willAffectTenure: boolean;
}

export default function ExtendedAbsenceForm({ userId, absence, onSuccess, onCancel }: ExtendedAbsenceFormProps) {
  const [tenureImpact, setTenureImpact] = useState<TenureImpact | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, watch } = useForm<ExtendedAbsenceFormValues>({
    defaultValues: {
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

  const startDate = watch("start_date");
  const endDate = watch("end_date");

  useEffect(() => {
    if (absence) {
      reset({
        start_date: absence.start_date || "",
        end_date: absence.end_date || "",
        reason: absence.reason || "",
      });
    } else {
      reset({
        start_date: "",
        end_date: "",
        reason: "",
      });
    }
  }, [absence, reset]);

  useEffect(() => {
    if (startDate && endDate && startDate <= endDate) {
      calculateTenureImpact(startDate, endDate);
    } else {
      setTenureImpact(null);
    }
  }, [startDate, endDate]);

  const calculateTenureImpact = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const today = new Date();
    
    const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const isCompleted = endDate <= today;
    const willAffectTenure = durationDays > 30;
    const tenureImpact = willAffectTenure ? durationDays : 0;
    
    setTenureImpact({
      durationDays,
      tenureImpact,
      isCompleted,
      willAffectTenure
    });
  };

  const onSubmit = async (data: ExtendedAbsenceFormValues) => {
    if (data.end_date < data.start_date) {
      toast.error("End date cannot be before start date.");
      return;
    }
    const payload = { ...data, user_id: userId };
    let result;
    if (absence) {
      result = await updateExtendedAbsence(absence.id, payload);
    } else {
      result = await createExtendedAbsence(payload);
    }
    if (!result.success) {
      toast.error("Failed to save absence.", { description: result.error });
      return;
    }
    toast.success("Absence saved successfully!");
    onSuccess();
  };

  const getTenureImpactBadge = () => {
    if (!tenureImpact) return null;
    
    if (tenureImpact.willAffectTenure) {
      return (
        <Badge variant="destructive" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Will affect tenure (+{tenureImpact.tenureImpact} days)
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        No tenure impact (&le;30 days)
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900">
          {absence ? "Edit Extended Absence" : "Add Extended Absence"}
        </h3>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="bg-purple-50/50">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              Extended Absence Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Start Date *</Label>
                <Input type="date" {...register("start_date", { required: true })} />
                {errors.start_date && <div className="text-red-600 text-sm font-medium">Start date is required</div>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">End Date *</Label>
                <Input type="date" {...register("end_date", { required: true })} />
                {errors.end_date && <div className="text-red-600 text-sm font-medium">End date is required</div>}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Reason</Label>
              <Input {...register("reason")} placeholder="Optional" />
            </div>
          </CardContent>
        </Card>

        {/* Tenure Impact Preview */}
        {tenureImpact && (
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Clock className="h-5 w-5" />
                Tenure Impact Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Duration:</span>
                    <span className="text-lg font-semibold text-gray-900">{tenureImpact.durationDays} days</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge variant={tenureImpact.isCompleted ? "secondary" : "outline"}>
                      {tenureImpact.isCompleted ? "Completed" : "Future"}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Tenure Impact:</span>
                    {getTenureImpactBadge()}
                  </div>
                  
                  {tenureImpact.willAffectTenure && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          This absence will extend the employee's tenure by {tenureImpact.tenureImpact} days
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {!tenureImpact.willAffectTenure && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          This absence will not affect tenure calculations
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200">
            {isSubmitting ? "Saving..." : absence ? "Save Changes" : "Add Absence"}
          </Button>
        </div>
      </form>
    </div>
  );
} 