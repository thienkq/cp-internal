import { createServerClient } from "@workspace/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

export default async function LeaveTypesPage() {
  const supabase = await createServerClient()
  
  const { data: leaveTypes, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching leave types:', error)
  }

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Leave Types</h1>
        <p className="text-gray-600">Manage all leave types and their configurations</p>
      </div>

      {/* Leave Types Cards */}
      <div className="space-y-4">
        {leaveTypes?.map((leaveType: any) => (
          <Card key={leaveType.id} className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {leaveType.name}
                    </h3>
                    <Badge variant={leaveType.is_paid ? "secondary" : "outline"} className={leaveType.is_paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {leaveType.is_paid ? "Paid" : "Unpaid"}
                    </Badge>
                    {leaveType.supports_half_day && (
                      <Badge variant="outline">Half Day</Badge>
                    )}
                    {leaveType.supports_carryover && (
                      <Badge variant="blue">Carryover</Badge>
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {leaveType.description || `${leaveType.name.toLowerCase()} leave`}
                  </p>
                  
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>
                      Annual Quota: <span className="font-medium">
                        {leaveType.quota || 'Unlimited'}
                      </span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Leave Type Button */}
      <div className="mt-6">
        <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Leave Type
        </button>
      </div>
    </div>
  )
} 