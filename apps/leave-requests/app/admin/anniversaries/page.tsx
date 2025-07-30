import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Calendar, Trophy, Users } from "lucide-react";
import { getThisMonthAnniversaries } from "@/lib/anniversary-utils";

export default async function AnniversariesPage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Get this month's anniversaries
  const anniversaries = await getThisMonthAnniversaries();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilText = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };

  const getBadgeVariant = (days: number) => {
    if (days === 0) return "default";
    if (days <= 7) return "destructive";
    if (days <= 30) return "secondary";
    return "outline";
  };

  const getYearText = (years: number) => {
    if (years === 1) return '1st';
    if (years === 2) return '2nd';
    if (years === 3) return '3rd';
    return `${years}th`;
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">This Month's Work Anniversaries</h1>
          <p className="text-gray-600">View work anniversaries for the current month</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              This Month's Anniversaries ({anniversaries.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {anniversaries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No anniversaries this month</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anniversaries.map((anniversary) => (
                  <div 
                    key={anniversary.user_id} 
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-lg">
                        {anniversary.full_name}
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(anniversary.anniversary_date)}</span>
                        <span className="mx-1">•</span>
                        <span className="font-medium">{getYearText(anniversary.years)} anniversary</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Started: {new Date(anniversary.start_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={getBadgeVariant(anniversary.days_until)} className="mb-2">
                        {getDaysUntilText(anniversary.days_until)}
                      </Badge>
                      <div className="text-xs text-gray-500">
                        {anniversary.days_until} days away
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-sm text-gray-500">
          <p>💡 <strong>Note:</strong> This list shows anniversaries for the current month only, sorted by day of the month.</p>
          <p>🎉 <strong>Anniversary Logic:</strong> Only shows users with at least 1 year of effective service (deducting extended absences &gt;30 days).</p>
        </div>
      </div>
    </PageContainer>
  );
} 