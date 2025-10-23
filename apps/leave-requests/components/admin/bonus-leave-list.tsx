"use client";
import { useState, useEffect } from "react";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@workspace/ui/components/select";
import { toast } from "sonner";
// TODO: Replace with NextAuth client-side auth
import { deleteBonusLeaveGrant, getAllBonusLeaveGrants, type BonusLeaveSummary } from "@/app/actions/bonus-leave";
import { Gift, Trash2, Award, Calendar, User } from "lucide-react";

interface BonusLeaveListProps {
  currentUser: { id: string; full_name: string };
}

export default function BonusLeaveList({ currentUser }: BonusLeaveListProps) {
  const [bonusLeaveData, setBonusLeaveData] = useState<BonusLeaveSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentYear] = useState(new Date().getFullYear());

  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const loadBonusLeaveData = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBonusLeaveGrants(selectedYear);
      setBonusLeaveData(data);
    } catch (error) {
      console.error("Error loading bonus leave data:", error);
      toast.error("Failed to load bonus leave data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBonusLeaveData();
  }, [selectedYear]);

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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Bonus Leave Grants ({selectedYear})
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Year:</span>
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
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading bonus leave data...</p>
          </div>
        ) : bonusLeaveData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Gift className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <p>No bonus leave grants found for {selectedYear}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bonusLeaveData.map((summary) => (
              <Card key={`${summary.user_id}-${summary.year}`} className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-purple-500" />
                      <span className="font-medium">{summary.full_name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-sm font-medium text-green-600">{summary.total_granted}</div>
                        <div className="text-xs text-gray-500">Granted</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-red-600">{summary.total_used}</div>
                        <div className="text-xs text-gray-500">Used</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-medium text-blue-600">{summary.remaining}</div>
                        <div className="text-xs text-gray-500">Remaining</div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {summary.grants.map((grant) => (
                      <div key={grant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
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
                                                      <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                {new Date(grant.granted_at).toLocaleDateString()}
                              </div>
                            </div>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 