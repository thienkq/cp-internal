"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";
import { LeaveRequestTable } from "@/components/leave/leave-request-table";
import type { LeaveRequest as LeaveRequestType } from "@/types";
import { useEffect, useState } from "react";

// using project-wide LeaveRequest type

interface LeaveTypeTabsProps {
  selectedTab: string;
  selectedYear: number;
  all: LeaveRequestType[];
  annual: LeaveRequestType[];
  emergency: LeaveRequestType[];
  wedding: LeaveRequestType[];
  unpaid: LeaveRequestType[];
}

export function LeaveTypeTabs({ selectedTab, selectedYear, all, annual, emergency, wedding, unpaid }: LeaveTypeTabsProps) {
  const [value, setValue] = useState(selectedTab || "all");

  useEffect(() => {
    setValue(selectedTab || "all");
  }, [selectedTab]);

  const onChange = (v: string) => {
    setValue(v);
    // const url = `/dashboard/leave-requests?year=${selectedYear}&tab=${v}`;
    // update URL if needed
  };

  const counts = {
    all: all.length,
    annual: annual.length,
    emergency: emergency.length,
    wedding: wedding.length,
    unpaid: unpaid.length,
  };

  return (
    <Tabs value={value} onValueChange={onChange} className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
        <TabsTrigger value="annual">Annual ({counts.annual})</TabsTrigger>
        <TabsTrigger value="emergency">Emergency ({counts.emergency})</TabsTrigger>
        <TabsTrigger value="wedding">Wedding ({counts.wedding})</TabsTrigger>
        <TabsTrigger value="unpaid">Unpaid ({counts.unpaid})</TabsTrigger>
      </TabsList>

      <TabsContent
        value="all"
        className="min-h-[320px] overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300"
      >
        <LeaveRequestTable
          leaveRequests={all}
          title={`${selectedYear} Time Off History`}
          showUserColumn={false}
          showActions={false}
          showUserActions={true}
          emptyMessage={`You haven't submitted any time off requests for ${selectedYear} yet.`}
        />
      </TabsContent>

      <TabsContent
        value="annual"
        className="min-h-[320px] overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300"
      >
        <LeaveRequestTable
          leaveRequests={annual}
          title={"Annual Leave Requests"}
          showUserColumn={false}
          showActions={false}
          showUserActions={true}
          emptyMessage={"No annual leave requests found."}
        />
      </TabsContent>

      <TabsContent
        value="emergency"
        className="min-h-[320px] overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300"
      >
        <LeaveRequestTable
          leaveRequests={emergency}
          title={"Emergency Leave Requests"}
          showUserColumn={false}
          showActions={false}
          showUserActions={true}
          emptyMessage={"No emergency leave requests found."}
        />
      </TabsContent>

      <TabsContent
        value="wedding"
        className="min-h-[320px] overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300"
      >
        <LeaveRequestTable
          leaveRequests={wedding}
          title={"Wedding Leave Requests"}
          showUserColumn={false}
          showActions={false}
          showUserActions={true}
          emptyMessage={"No wedding leave requests found."}
        />
      </TabsContent>

      <TabsContent
        value="unpaid"
        className="min-h-[320px] overflow-hidden data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:slide-in-from-top-1 data-[state=active]:duration-300"
      >
        <LeaveRequestTable
          leaveRequests={unpaid}
          title={"Unpaid Leave Requests"}
          showUserColumn={false}
          showActions={false}
          showUserActions={true}
          emptyMessage={"No unpaid leave requests found."}
        />
      </TabsContent>
    </Tabs>
  );
}


