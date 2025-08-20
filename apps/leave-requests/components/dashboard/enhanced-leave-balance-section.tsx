import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { calculateCompleteLeaveEntitlement } from "@/lib/leave-quota-utils";
import { createServerClient } from "@workspace/supabase";

interface EnhancedLeaveBalanceSectionProps {
  userId: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function formatAnniversary(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric'
  });
}

function calculateCorrectedQuota(entitlement: any): { 
  quota: number; 
  isOnboarding: boolean; 
  employmentYear: number;
  daysWorked: number;
  explanation: string;
  quotaReason: string;
} {
  if (!entitlement.originalStartDate) {
    return {
      quota: entitlement.totalQuota,
      isOnboarding: true,
      employmentYear: 1,
      daysWorked: 0,
      explanation: "No start date set, using default quota",
      quotaReason: "Default onboarding year quota (12 days, prorated based on start month)"
    };
  }

  const startDate = new Date(entitlement.originalStartDate);
  const currentDate = new Date();
  
  // Calculate actual days worked
  const daysWorked = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate years of service completed
  const yearsCompleted = Math.floor(daysWorked / 365);
  const employmentYear = yearsCompleted + 1; // Year 1, 2, 3, 4, 5+
  
  if (daysWorked < 365) {
    // Still in onboarding year (Year 1)
    const startMonth = startDate.getMonth() + 1;
    const proratedQuota = Math.max(1, 12 - startMonth + 1);
    
    return {
      quota: proratedQuota,
      isOnboarding: true,
      employmentYear: 1,
      daysWorked,
      explanation: `Onboarding year: ${daysWorked} days worked, started month ${startMonth}`,
      quotaReason: `Year 1 quota: 12 days prorated by start month (12 - ${startMonth} + 1 = ${proratedQuota} days)`
    };
  } else {
    // Post-onboarding years (Year 2, 3, 4, 5+)
    let quota: number;
    let quotaReason: string;
    
    if (employmentYear === 2) {
      quota = 13;
      quotaReason = "Year 2 quota: 13 days (completed 1 full year of service)";
    } else if (employmentYear === 3) {
      quota = 15;
      quotaReason = "Year 3 quota: 15 days (completed 2 full years of service)";
    } else if (employmentYear === 4) {
      quota = 18;
      quotaReason = "Year 4 quota: 18 days (completed 3 full years of service)";
    } else {
      quota = 22;
      quotaReason = `Year ${employmentYear >= 5 ? "5+" : employmentYear} quota: 22 days (completed ${yearsCompleted} full years of service)`;
    }
    
    return {
      quota,
      isOnboarding: false,
      employmentYear: Math.min(employmentYear, 5), // Cap display at Year 5
      daysWorked,
      explanation: `Completed ${yearsCompleted} year(s) of service (${daysWorked} days worked)`,
      quotaReason
    };
  }
}

export async function EnhancedLeaveBalanceSection({ userId }: EnhancedLeaveBalanceSectionProps) {
  const entitlement = await calculateCompleteLeaveEntitlement(userId);
  
  // Get extended absences for current year
  const supabase = await createServerClient();
  const currentYear = new Date().getFullYear();
  const { data: currentYearAbsences } = await supabase
    .from("extended_absences")
    .select("*")
    .eq("user_id", userId)
    .gte("start_date", `${currentYear}-01-01`)
    .lte("end_date", `${currentYear}-12-31`);
  
  // Calculate corrected quota with detailed information
  const quotaAnalysis = calculateCorrectedQuota(entitlement);
  
  // Calculate current year absence impact
  let currentYearAbsenceDays = 0;
  if (currentYearAbsences) {
    for (const absence of currentYearAbsences) {
      const start = new Date(absence.start_date);
      const end = new Date(absence.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      currentYearAbsenceDays += days;
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Leave Entitlement Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Original Start Date</p>
            <p className="font-medium">
              {entitlement.originalStartDate ? formatDate(entitlement.originalStartDate) : "Not set"}
            </p>
            {!entitlement.originalStartDate && (
              <p className="text-xs text-yellow-600">Using default quota</p>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Working Anniversary</p>
            <p className="font-medium">
              {entitlement.workingAnniversary ? formatAnniversary(entitlement.workingAnniversary) : "Cannot calculate"}
            </p>
            {entitlement.extendedAbsenceImpact.anniversaryDelay > 0 && (
              <p className="text-xs text-orange-600">
                Delayed by {entitlement.extendedAbsenceImpact.anniversaryDelay} days
              </p>
            )}
          </div>
        </div>
        
        {/* Employment Year Status - CORRECTED */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">Employment Year Status</p>
              <p className="text-sm text-muted-foreground">
                {quotaAnalysis.isOnboarding ? "Onboarding Year (Prorated)" : `Year ${quotaAnalysis.employmentYear} (Post-Onboarding)`}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {quotaAnalysis.explanation}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{quotaAnalysis.quota} days</p>
              <p className="text-xs text-blue-600">{quotaAnalysis.quotaReason}</p>
            </div>
          </div>
        </div>
        
        {/* Current Year Extended Absence Impact */}
        {currentYearAbsenceDays > 0 && (
          <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded">
            <h4 className="font-medium text-red-800">Current Year Extended Absence Impact</h4>
            <div className="mt-2 space-y-1 text-sm text-red-700">
              <p>Total absence days this year: {currentYearAbsenceDays}</p>
              <p>Base quota: {quotaAnalysis.quota} days {quotaAnalysis.isOnboarding ? "(Onboarding Year)" : `(Year ${quotaAnalysis.employmentYear})`}</p>
              {!quotaAnalysis.isOnboarding && (
                <p>Adjusted quota: {Math.max(1, Math.round(quotaAnalysis.quota - (currentYearAbsenceDays / 365 * quotaAnalysis.quota)))} days</p>
              )}
              <p className="text-xs text-red-600">Note: Extended absences may reduce current year's leave entitlement</p>
            </div>
          </div>
        )}
        
        {/* Extended Absence Impact */}
        {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
          <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
            <h4 className="font-medium text-orange-800">Overall Extended Absence Impact</h4>
            <div className="mt-2 space-y-1 text-sm text-orange-700">
              <p>Total absence days: {entitlement.extendedAbsenceImpact.totalAbsenceDays}</p>
              <p>Tenure reduction: {entitlement.extendedAbsenceImpact.tenureReduction}</p>
              <p>Anniversary delay: {entitlement.extendedAbsenceImpact.anniversaryDelay} days</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Calculated Employment Year</p>
            <p className="font-medium">Year {quotaAnalysis.employmentYear}</p>
            <p className="text-xs text-gray-500">Based on actual days worked</p>
          </div>
        </div>
        
        {/* Extended Absence Status */}
        {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
          <div className="text-sm">
            <p className="text-muted-foreground">Extended Absences Detected</p>
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
              Adjusted for {entitlement.extendedAbsenceImpact.totalAbsenceDays} days of absences
            </Badge>
          </div>
        )}
        
        {entitlement.extendedAbsenceImpact.totalAbsenceDays === 0 && (
          <div className="text-sm">
            <p className="text-muted-foreground">No Extended Absences</p>
            <Badge variant="outline" className="text-xs text-green-600 border-green-300">
              No adjustments needed
            </Badge>
          </div>
        )}

        {/* Quota Calculation Details */}
        <div className="p-4 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-800 mb-2">
            {quotaAnalysis.isOnboarding ? "Onboarding Year Calculation" : `Year ${quotaAnalysis.employmentYear} Quota Calculation`}
          </h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Start Date: {entitlement.originalStartDate ? formatDate(entitlement.originalStartDate) : "Not set"}</p>
            <p>• Current Date: {formatDate(new Date().toISOString())}</p>
            <p>• Days Worked: {quotaAnalysis.daysWorked} days</p>
            <p>• Employment Year: Year {quotaAnalysis.employmentYear}</p>
            <p>• Status: {quotaAnalysis.explanation}</p>
            <p>• Quota Calculation: {quotaAnalysis.quotaReason}</p>
            
            {quotaAnalysis.isOnboarding && (
              <>
                <p>• Start Month: {entitlement.originalStartDate ? new Date(entitlement.originalStartDate).getMonth() + 1 : "N/A"}</p>
                <p>• Prorated Formula: 12 - start_month + 1 = {quotaAnalysis.quota} days</p>
              </>
            )}
            
            {!quotaAnalysis.isOnboarding && (
              <>
                <p>• Years Completed: {Math.floor(quotaAnalysis.daysWorked / 365)} full year(s)</p>
                <p>• Quota Rules: Year 1: 12, Year 2: 13, Year 3: 15, Year 4: 18, Year 5+: 22</p>
              </>
            )}
            
            {currentYearAbsenceDays > 0 && (
              <p>• Extended Absence Impact: {currentYearAbsenceDays} days this year</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}