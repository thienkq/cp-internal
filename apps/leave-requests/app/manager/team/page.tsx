import { getCurrentUser } from "@workspace/supabase";
import { redirect } from "next/navigation";
import { PageContainer } from "@workspace/ui/components/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar";
import { Users, Calendar, Clock, CheckSquare } from "lucide-react";

export default async function ManagerTeamPage() {
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user data to confirm manager role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!userData || !["manager", "admin"].includes(userData.role)) {
    redirect("/dashboard");
  }

  // Fetch all leave requests for team members to get unique team members
  const { data: teamRequests } = await supabase
    .from("leave_requests")
    .select(`
      user_id,
      status,
      start_date,
      user:users!leave_requests_user_id_fkey(id, full_name, email, role)
    `)
    .eq("current_manager_id", user.id);

  // Get unique team members with their statistics
  const teamMembersMap = new Map<string, any>();
  
  teamRequests?.forEach((request: any) => {
    if (request.user) {
      const userId = request.user.id;
      if (!teamMembersMap.has(userId)) {
        teamMembersMap.set(userId, {
          ...request.user,
          totalRequests: 0,
          pendingRequests: 0,
          approvedRequests: 0,
          recentRequestDate: null
        });
      }
      
      const member = teamMembersMap.get(userId);
      member.totalRequests++;
      
      if (request.status === 'pending') {
        member.pendingRequests++;
      } else if (request.status === 'approved') {
        member.approvedRequests++;
      }
      
      // Track most recent request
      if (!member.recentRequestDate || new Date(request.start_date) > new Date(member.recentRequestDate)) {
        member.recentRequestDate = request.start_date;
      }
    }
  });

  const teamMembers = Array.from(teamMembersMap.values()).sort((a, b) => 
    a.full_name.localeCompare(b.full_name)
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">My Team</h1>
          <p className="text-gray-600 mt-2">
            Manage and view information about your team members
          </p>
        </div>

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teamMembers.length}</div>
              <p className="text-xs text-gray-600">
                People reporting to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.reduce((sum, member) => sum + member.pendingRequests, 0)}
              </div>
              <p className="text-xs text-gray-600">
                Pending leave requests
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved This Year</CardTitle>
              <CheckSquare className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {teamMembers.reduce((sum, member) => sum + member.approvedRequests, 0)}
              </div>
              <p className="text-xs text-gray-600">
                Total approved requests
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                <p className="text-gray-600">
                  No leave requests have been assigned to you as a manager yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-blue-100 text-blue-700">
                          {getInitials(member.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{member.full_name}</h3>
                        <p className="text-sm text-gray-600">{member.email}</p>
                        {member.recentRequestDate && (
                          <p className="text-xs text-gray-500">
                            Last request: {new Date(member.recentRequestDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {member.pendingRequests > 0 && (
                        <Badge variant="outline" className="text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {member.pendingRequests} pending
                        </Badge>
                      )}
                      
                      {member.approvedRequests > 0 && (
                        <Badge variant="outline" className="text-green-600">
                          <CheckSquare className="h-3 w-3 mr-1" />
                          {member.approvedRequests} approved
                        </Badge>
                      )}
                      
                      <Badge variant="secondary">
                        <Calendar className="h-3 w-3 mr-1" />
                        {member.totalRequests} total
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}