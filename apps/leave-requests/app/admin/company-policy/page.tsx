import { createServerClient } from "@workspace/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { Badge } from "@workspace/ui/components/badge"

export default async function CompanyPolicyPage() {
  const supabase = await createServerClient()
  
  const { data: companySettings, error } = await supabase
    .from('company_settings')
    .select('*')
    .single()

  if (error) {
    console.error('Error fetching company settings:', error)
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const carryoverExpiry = companySettings ? 
    `${monthNames[companySettings.carryover_expiry_month - 1]} ${companySettings.carryover_expiry_day}` :
    'Not configured'

  return (
    <div className="flex-1 p-6 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Company Policy</h1>
        <p className="text-gray-600">Add and manage company policies, tenure rules, carryover settings and global leave configurations</p>
      </div>

      <div className="space-y-6">
        {/* Carryover Policy */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Carryover Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carryover Expiry Date
                </label>
                <p className="text-gray-900 font-medium">{carryoverExpiry}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Unused leave days from the previous year will expire on this date
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenure-Based Leave Accrual */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Tenure-Based Leave Accrual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 mb-4">
                Annual leave quota automatically increases based on years of active service
              </p>
              
              {companySettings?.tenure_accrual_rules && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                     {Object.entries(companySettings.tenure_accrual_rules).map(([year, days]: [string, any]) => (
                    <div key={year} className="p-4 border border-gray-200 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {days}
                        </div>
                        <div className="text-sm text-gray-500">
                          {year === '1' ? '1st year' : 
                           year === '2' ? '2nd year' : 
                           year === '3' ? '3rd year' : 
                           `${year}${parseInt(year) >= 5 ? '+' : 'th'} year${parseInt(year) >= 5 ? 's' : ''}`}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          days per year
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Service Calculation */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg">Active Service Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Tenure is calculated based on total "active service time", excluding extended absences.
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Extended Absence Definition</h4>
                <p className="text-sm text-blue-800">
                  Any period of unpaid leave, sabbatical, or other approved absence lasting longer than 
                  <span className="font-semibold"> 1 month (30 consecutive days)</span> is excluded from tenure calculation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Changes Button */}
      <div className="mt-6">
        <button className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  )
} 