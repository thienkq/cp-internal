import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { getDb } from "@/db"
import { companySettings } from "@/db/schema"

export default async function CompanyPolicyPage() {
  const db = getDb()
  
  let companySettingsData = null
  try {
    const result = await db
      .select()
      .from(companySettings)
      .limit(1)
    
    companySettingsData = result[0] || null
  } catch (error) {
    console.error('Error fetching company settings:', error)
  }

  // Type guard for tenure accrual rules
  const tenureAccrualRules = companySettingsData?.tenure_accrual_rules as Record<string, number> | undefined

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const carryoverExpiry = companySettingsData ? 
    `${monthNames[companySettingsData.carryover_expiry_month - 1]} ${companySettingsData.carryover_expiry_day}` :
    'Not configured'

  return (
    <div className="flex-1 p-6 bg-background">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground mb-2">Company Policy</h1>
        <p className="text-muted-foreground">Add and manage company policies, tenure rules, carryover settings and global leave configurations</p>
      </div>

      <div className="space-y-6">
        {/* Carryover Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Carryover Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Carryover Expiry Date
                </label>
                <p className="text-foreground font-medium">{carryoverExpiry}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Unused leave days from the previous year will expire on this date
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenure-Based Leave Accrual */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenure-Based Leave Accrual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-4">
                Annual leave quota automatically increases based on years of active service
              </p>
              
              {tenureAccrualRules && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(tenureAccrualRules).map(([year, days]) => (
                    <div key={year} className="p-4 border border-border rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {days}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {year === '1' ? '1st year' : 
                           year === '2' ? '2nd year' : 
                           year === '3' ? '3rd year' : 
                           `${year}${parseInt(year) >= 5 ? '+' : 'th'} year${parseInt(year) >= 5 ? 's' : ''}`}
                        </div>
                        <div className="text-xs text-muted-foreground/70 mt-1">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Service Calculation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tenure is calculated based on total &ldquo;active service time&rdquo;, excluding extended absences.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Extended Absence Definition</h4>
                <p className="text-sm text-muted-foreground">
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
        <button className="cursor-pointer inline-flex items-center px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors">
          Save Changes
        </button>
      </div>
    </div>
  )
} 