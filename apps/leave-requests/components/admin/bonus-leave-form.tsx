"use client";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
// TODO: Replace with NextAuth client-side auth
import { grantBonusLeave, type GrantBonusLeaveData } from "@/app/actions/bonus-leave";
import { Plus, Gift } from "lucide-react";
import { UserSelect } from "@/components/users/user-select";

interface BonusLeaveFormProps {
  currentUser: { id: string; full_name: string };
}

export default function BonusLeaveForm({ currentUser }: BonusLeaveFormProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [formData, setFormData] = useState({
    user_id: "",
    year: currentYear,
    days_granted: 1,
    reason: ""
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const grantData: GrantBonusLeaveData = {
        user_id: formData.user_id,
        year: formData.year,
        days_granted: formData.days_granted,
        reason: formData.reason || undefined
      };

      const result = await grantBonusLeave(grantData, currentUser.id);
      
      if (result) {
        toast.success("Bonus leave granted successfully!");
        setIsDialogOpen(false);
        setFormData({
          user_id: "",
          year: currentYear,
          days_granted: 1,
          reason: ""
        });
        window.location.reload();
      } else {
        toast.error("Failed to grant bonus leave. Please check if you have admin permissions.");
      }
    } catch (error) {
      console.error("Error granting bonus leave:", error);
      toast.error("Failed to grant bonus leave");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Grant Bonus Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Grant Bonus Leave
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">Employee</Label>
            <UserSelect
              value={formData.user_id || undefined}
              onChange={(value: string) => setFormData(prev => ({ ...prev, user_id: value || "" }))}
              placeholder="Select employee"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year">Year</Label>
              <Select 
                value={formData.year.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, year: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="days_granted">Days to Grant</Label>
              <Input
                id="days_granted"
                type="number"
                min="1"
                max="30"
                value={formData.days_granted}
                onChange={(e) => setFormData(prev => ({ ...prev, days_granted: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="reason">Reason (Optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Outstanding performance, Special project completion"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.user_id}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? "Granting..." : "Grant Bonus Leave"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 