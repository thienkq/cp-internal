import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { calculateCompleteLeaveEntitlement } from "@/lib/leave-quota-utils";
import { getDb } from "@/db";
import { users, leaveRequests, bonusLeaveGrants, extendedAbsences } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import type { ExtendedAbsence } from "@/types";

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

interface ExtendedAbsenceWithImpact extends ExtendedAbsence {
  durationDays: number;
  tenureImpact: number;
  isCompleted: boolean;
}

function calculateAbsenceImpact(absence: ExtendedAbsence): ExtendedAbsenceWithImpact {
  const startDate = new Date(absence.start_date);
  const endDate = new Date(absence.end_date);
  const today = new Date();
  
  const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isCompleted = endDate <= today;
  
  // Only absences longer than 30 days affect tenure
  const tenureImpact = durationDays > 30 ? durationDays : 0;
  
  return {
    ...absence,
    durationDays,
    tenureImpact,
    isCompleted
  };
}

function getStatusBadge(absence: ExtendedAbsenceWithImpact) {
  const today = new Date();
  const startDate = new Date(absence.start_date);
  const endDate = new Date(absence.end_date);
  
  if (endDate < today) {
    return <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">Completed</Badge>;
  } else if (startDate <= today && endDate >= today) {
    return <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Ongoing</Badge>;
  } else {
    return <Badge variant="outline" className="text-xs text-purple-600 border-purple-300">Upcoming</Badge>;
  }
}

function getTenureImpactText(absence: ExtendedAbsenceWithImpact): string {
  if (absence.tenureImpact > 0) {
    return `+${absence.tenureImpact} days to tenure`;
  } else {
    return "No tenure impact";
  }
}

function calculateCorrectedQuota(entitlement: any): { 
  quota: number; 
  isOnboarding: boolean; 
  employmentYear: number;
  effectiveEmploymentYear: number;
  daysWorked: number;
  explanation: string;
  quotaReason: string;
} {
  if (!entitlement.originalStartDate) {
    return {
      quota: entitlement.totalQuota,
      isOnboarding: true,
      employmentYear: 1,
      effectiveEmploymentYear: 1,
      daysWorked: 0,
      explanation: "No start date set, using default quota",
      quotaReason: "Default onboarding year quota (12 days, prorated based on start month)"
    };
  }

  const startDate = new Date(entitlement.originalStartDate);
  const currentDate = new Date();
  
  // Calculate actual days worked (ignoring extended absences)
  const daysWorked = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Use the effective employment year that already accounts for extended absences
  const effectiveEmploymentYear = entitlement.effectiveEmploymentYear;
  const employmentYear = entitlement.employmentYear; // Original employment year without absences
  const isOnboarding = entitlement.isOnboardingYear;
  
  if (isOnboarding) {
    // Still in onboarding year (Year 1) - use the calculated quota from entitlement
    return {
      quota: entitlement.totalQuota,
      isOnboarding: true,
      employmentYear: effectiveEmploymentYear,
      effectiveEmploymentYear,
      daysWorked,
      explanation: `Onboarding year: ${daysWorked} days worked total`,
      quotaReason: entitlement.proratedQuota 
        ? `Year 1 quota: ${entitlement.totalQuota} days (prorated)`
        : `Year 1 quota: ${entitlement.totalQuota} days`
    };
  } else {
    // Post-onboarding years - use effective employment year
    const quota = entitlement.totalQuota;
    let quotaReason: string;
    
    if (effectiveEmploymentYear === 2) {
      quotaReason = "Year 2 quota: 13 days (completed 1 effective year of service)";
    } else if (effectiveEmploymentYear === 3) {
      quotaReason = "Year 3 quota: 15 days (completed 2 effective years of service)";
    } else if (effectiveEmploymentYear === 4) {
      quotaReason = "Year 4 quota: 18 days (completed 3 effective years of service)";
    } else {
      quotaReason = `Year ${effectiveEmploymentYear >= 5 ? "5+" : effectiveEmploymentYear} quota: 22 days (completed ${effectiveEmploymentYear - 1} effective years of service)`;
    }
    
    // Add explanation about extended absence impact
    const absenceImpact = entitlement.extendedAbsenceImpact;
    const hasAbsences = absenceImpact.totalAbsenceDays > 0;
    
    let explanation = `Completed ${effectiveEmploymentYear - 1} effective year(s) of service (${daysWorked} days worked total)`;
    if (hasAbsences) {
      explanation += `, delayed by ${absenceImpact.totalAbsenceDays} absence days`;
    }
    
    return {
      quota,
      isOnboarding: false,
      employmentYear: effectiveEmploymentYear,
      effectiveEmploymentYear,
      daysWorked,
      explanation,
      quotaReason
    };
  }
}

export async function EnhancedLeaveBalanceSection({ userId }: EnhancedLeaveBalanceSectionProps) {
  const entitlement = await calculateCompleteLeaveEntitlement(userId);
  
  // TODO: Replace with Drizzle queries
  const currentYearAbsences: any[] = [];
  
  // TODO: Replace with Drizzle queries
  const allAbsences: any[] = [];
  
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
                {quotaAnalysis.isOnboarding ? "Onboarding Year (Prorated)" : `Year ${quotaAnalysis.employmentYear}`}
              </p>
              {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && !quotaAnalysis.isOnboarding && (
                <p className="text-xs text-orange-600 mt-1">
                  Would be Year {entitlement.employmentYear} without extended absences
                </p>
              )}
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
      
        
        {/* Extended Absence Impact */}
        {/* {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
          <div className="p-4 border-l-4 border-orange-500 bg-orange-50 rounded">
            <h4 className="font-medium text-orange-800">Overall Extended Absence Impact</h4>
            <div className="mt-2 space-y-1 text-sm text-orange-700">
              <p>Total absence days: {entitlement.extendedAbsenceImpact.totalAbsenceDays}</p>
              <p>Tenure reduction: {entitlement.extendedAbsenceImpact.tenureReduction}</p>
              <p>Anniversary delay: {entitlement.extendedAbsenceImpact.anniversaryDelay} days</p>
            </div>
          </div>
        )} */}
        
        {/* Extended Absences List */}
        {allAbsences && allAbsences.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">Extended Absences History</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-3">
                {allAbsences.map((absence) => {
                  const absenceWithImpact = calculateAbsenceImpact(absence);
                  return (
                    <div key={absence.id} className="bg-white p-3 rounded-md border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">
                                {formatDate(absence.start_date)} - {formatDate(absence.end_date)}
                              </div>
                              {absence.reason && (
                                <div className="text-gray-500 text-xs">{absence.reason}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{absenceWithImpact.durationDays} days</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {getStatusBadge(absenceWithImpact)}
                          <div className="flex items-center gap-1">
                            {absenceWithImpact.tenureImpact > 0 ? (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
                            <span className={`text-xs ${absenceWithImpact.tenureImpact > 0 ? 'text-red-700' : 'text-green-700'}`}>
                              {getTenureImpactText(absenceWithImpact)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {allAbsences.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-sm">No extended absences recorded</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Effective Employment Year</p>
            <p className="font-medium">Year {quotaAnalysis.employmentYear}</p>
            <p className="text-xs text-gray-500">Adjusted for extended absences</p>
          </div>
          {/* {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
            <div>
              <p className="text-muted-foreground">Original Employment Year</p>
              <p className="font-medium">Year {entitlement.employmentYear}</p>
              <p className="text-xs text-gray-500">Without absence adjustments</p>
            </div>
          )} */}
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
            <p>• Effective Employment Year: Year {quotaAnalysis.employmentYear}</p>
            {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
              <p>• Original Employment Year: Year {entitlement.employmentYear} (before absence adjustments)</p>
            )}
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
                <p>• Effective Years Completed: {quotaAnalysis.employmentYear - 1} full year(s)</p>
                <p>• Quota Rules: Year 1: 12, Year 2: 13, Year 3: 15, Year 4: 18, Year 5+: 22</p>
                {entitlement.extendedAbsenceImpact.totalAbsenceDays > 0 && (
                  <p>• Extended Absence Delay: {entitlement.extendedAbsenceImpact.totalAbsenceDays} days reduces effective service</p>
                )}
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