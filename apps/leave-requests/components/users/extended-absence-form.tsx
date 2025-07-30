"use client";
import { useForm } from "react-hook-form";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { toast } from "sonner";
import { createBrowserClient } from "@workspace/supabase";
import type { ExtendedAbsence } from "@/types";
import { useEffect } from "react";

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

export default function ExtendedAbsenceForm({ userId, absence, onSuccess, onCancel }: ExtendedAbsenceFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<ExtendedAbsenceFormValues>({
    defaultValues: {
      start_date: "",
      end_date: "",
      reason: "",
    },
  });

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

  const onSubmit = async (data: ExtendedAbsenceFormValues) => {
    if (data.end_date < data.start_date) {
      toast.error("End date cannot be before start date.");
      return;
    }
    const supabase = createBrowserClient();
    let res;
    const payload = { ...data, user_id: userId };
    if (absence) {
      res = await supabase.from("extended_absences").update(payload).eq("id", absence.id).select();
    } else {
      res = await supabase.from("extended_absences").insert([payload]).select();
    }
    if (res.error) {
      toast.error("Failed to save absence.", { description: res.error.message });
      return;
    }
    toast.success("Absence saved successfully!");
    onSuccess();
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