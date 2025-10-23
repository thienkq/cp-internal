"use client";
import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { Badge } from "@workspace/ui/components/badge";
import { Separator } from "@workspace/ui/components/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
// TODO: Replace Supabase calls with API routes
import { 
  grantBonusLeave, 
  deleteBonusLeaveGrant,
  type GrantBonusLeaveData 
} from "@/app/actions/bonus-leave";
import { type BonusLeaveSummary } from "@/lib/bonus-leave-utils";
import { Plus, Gift, Trash2, Calendar, User, Award } from "lucide-react";

interface BonusLeaveGrantsProps {
  userId: string;
  userName: string;
}

export default function BonusLeaveGrants({ userId, userName }: BonusLeaveGrantsProps) {
  const [bonusLeaveData, setBonusLeaveData] = useState<BonusLeaveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentYear] = useState(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [formData, setFormData] = useState({
    year: currentYear,
    days_granted: 1,
    reason: ""
  });

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const loadBonusLeaveData = async () => {
    setIsLoading(true);
    try {
      // TODO: Replace with API route call
      const grants: any[] = [];

      if (!grants || grants.length === 0) {
        setBonusLeaveData([]);
        return;
      }

      // Group by year
      const grouped: Record<number, BonusLeaveSummary> = {};
      
      grants.forEach(grant => {
        if (!grouped[grant.year]) {
          grouped[grant.year] = {
            user_id: grant.user_id,
            full_name: grant.user?.full_name || "Unknown User",
            year: grant.year,
            total_granted: 0,
            total_used: 0,
            remaining: 0,
            grants: []
          };
        }
        
        grouped[grant.year]!.total_granted += grant.days_granted;
        grouped[grant.year]!.total_used += grant.days_used;
        grouped[grant.year]!.grants.push({
          id: grant.id,
          user_id: grant.user_id,
          year: grant.year,
          days_granted: grant.days_granted,
          days_used: grant.days_used,
          reason: grant.reason,
          granted_by: grant.granted_by,
          granted_at: grant.granted_at,
          created_at: grant.created_at,
          updated_at: grant.updated_at
        });
      });

      // Calculate remaining for each year
      Object.values(grouped).forEach(summary => {
        summary.remaining = summary.total_granted - summary.total_used;
      });

      setBonusLeaveData(Object.values(grouped).sort((a, b) => b.year - a.year));
    } catch (error) {
      console.error("Error loading bonus leave data:", error);
      toast.error("Failed to load bonus leave data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBonusLeaveData();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // TODO: Replace with NextAuth client-side auth check

      const grantData: GrantBonusLeaveData = {
        user_id: userId,
        year: formData.year,
        days_granted: formData.days_granted,
        reason: formData.reason || undefined
      };

      // TODO: Get current user ID from NextAuth
      const result = await grantBonusLeave(grantData, 'current-user-id');
      
      if (result) {
        toast.success("Bonus leave granted successfully!");
        setIsDialogOpen(false);
        setFormData({
          year: currentYear,
          days_granted: 1,
          reason: ""
        });
        loadBonusLeaveData();
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

  const handleDeleteGrant = async (grantId: string) => {
    if (!confirm("Are you sure you want to delete this bonus leave grant?")) {
      return;
    }

    try {
      const success = await deleteBonusLeaveGrant(grantId);
      if (success) {
        toast.success("Bonus leave grant deleted successfully!");
        loadBonusLeaveData();
      } else {
        toast.error("Failed to delete bonus leave grant");
      }
    } catch (error) {
      console.error("Error deleting bonus leave grant:", error);
      toast.error("Failed to delete bonus leave grant");
    }
  };

  const currentYearData = bonusLeaveData.find(data => data.year === selectedYear);

  return (
    <Card className="shadow-sm border-l-4 border-l-purple-500">
      <CardHeader className="bg-purple-50/50">
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Gift className="h-5 w-5" />
          Bonus Leave Grants
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Year Selector */}
        <div className="flex items-center gap-4">
          <Label className="text-sm font-medium text-gray-700">View Year:</Label>
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-32">
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

        {/* Summary */}
        {currentYearData ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{currentYearData.total_granted}</div>
              <div className="text-sm text-gray-600">Total Granted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{currentYearData.total_used}</div>
              <div className="text-sm text-gray-600">Total Used</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{currentYearData.remaining}</div>
              <div className="text-sm text-gray-600">Remaining</div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No bonus leave data for {selectedYear}
          </div>
        )}

        {/* Grants List */}
        {currentYearData?.grants && currentYearData.grants.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Grant History</h4>
            {currentYearData.grants.map((grant) => (
              <div key={grant.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-purple-500" />
                    <span className="font-medium">{grant.days_granted} days</span>
                    <Badge variant="outline" className="text-xs">
                      {grant.days_used > 0 ? `${grant.days_used} used` : "Unused"}
                    </Badge>
                  </div>
                  {grant.reason && (
                    <p className="text-sm text-gray-600 mt-1">{grant.reason}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Granted on {new Date(grant.granted_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteGrant(grant.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Grant */}
        <Separator />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Grant Bonus Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grant Bonus Leave to {userName}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                  disabled={isSubmitting}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSubmitting ? "Granting..." : "Grant Bonus Leave"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
} 