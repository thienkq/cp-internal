'use client';

import { createContext, useContext } from 'react';
import type { User } from '@workspace/supabase';
import { AnniversaryInfo } from '@/lib/anniversary-utils';
import { LeaveBalance } from '@/lib/leave-quota-utils';
import { BonusLeaveSummary } from '@/lib/bonus-leave-utils';

export type DashboardContextType = {
  user: User;
  userName: string;
  userData: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    date_of_birth?: string | null;
    start_date?: string | null;
  };
  displayLeaveRequests: any;
  leaveBalance: LeaveBalance;
  bonusLeave: BonusLeaveSummary | null;
  isAnniversary: boolean;
  anniversaryInfo: AnniversaryInfo | null;
};
const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

// Provider component
export const DashboardProvider: React.FC<{
  children: React.ReactNode;
  user: User;
  userName: string;
  userData: {
    id: string;
    full_name?: string | null;
    email?: string | null;
    date_of_birth?: string | null;
    start_date?: string | null;
  };
  displayLeaveRequests: any;
  leaveBalance: LeaveBalance;
  bonusLeave: BonusLeaveSummary | null;
  isAnniversary: boolean;
  anniversaryInfo: AnniversaryInfo | null;
}> = ({
  children,
  user,
  userName,
  userData,
  displayLeaveRequests,
  leaveBalance,
  bonusLeave,
  isAnniversary,
  anniversaryInfo,
}) => {
  // Context value
  const contextValue: DashboardContextType = {
    user,
    userName,
    userData,
    displayLeaveRequests,
    leaveBalance,
    bonusLeave,
    isAnniversary,
    anniversaryInfo,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use the context
export const useDashboardContext = (): DashboardContextType => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error(
      'useDashboardContext must be used within a DashboardContext'
    );
  }
  return context;
};

// Export the context for advanced use cases
export { DashboardContext };
