import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Calendar, Trophy, Users, Gift } from "lucide-react";
import { getThisMonthAnniversaries } from "@/lib/anniversary-utils";
import { getThisMonthBirthdays } from "@/lib/birthday-utils";

export default async function AdminPage() {
  // Get this month's anniversaries and birthdays on the server side
  const anniversaries = await getThisMonthAnniversaries();
  const birthdays = await getThisMonthBirthdays();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilText = (days: number) => {
    if (days === 0) return "Today";
    if (days === 1) return "Tomorrow";
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days <= 7) return `${days} days`;
    if (days <= 30) return `${Math.ceil(days / 7)} weeks`;
    return `${Math.ceil(days / 30)} months`;
  };

  const getBadgeVariant = (days: number) => {
    if (days === 0) return "default";
    if (days < 0) return "secondary"; // Passed anniversaries
    if (days <= 7) return "destructive";
    if (days <= 30) return "secondary";
    return "outline";
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-4">Welcome, Admin!</h1>
          <p className="text-gray-600">This is the admin dashboard. Here you can manage users, view reports, and configure settings.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                This Month's Anniversaries
                <Badge variant="outline" className="ml-2">
                  {anniversaries.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anniversaries.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No anniversaries this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anniversaries.map((anniversary) => (
                    <div 
                      key={anniversary.user_id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {anniversary.full_name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(anniversary.anniversary_date)}
                          <span className="mx-1">•</span>
                          {anniversary.years}{anniversary.years === 1 ? 'st' : anniversary.years === 2 ? 'nd' : anniversary.years === 3 ? 'rd' : 'th'} anniversary
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(anniversary.days_until)}>
                        {getDaysUntilText(anniversary.days_until)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-pink-500" />
                This Month's Birthdays
                <Badge variant="outline" className="ml-2">
                  {birthdays.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {birthdays.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No birthdays this month</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {birthdays.map((birthday) => (
                    <div 
                      key={birthday.user_id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {birthday.full_name}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(birthday.birthday_date)}
                          <span className="mx-1">•</span>
                          {birthday.age} years old
                        </div>
                      </div>
                      <Badge variant={getBadgeVariant(birthday.days_until)}>
                        {getDaysUntilText(birthday.days_until)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
} 