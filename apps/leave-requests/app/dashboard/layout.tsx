"use client"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { TopNavbar } from "@/components/layout/top-navbar"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"

export default function LeaveRequestDashboard({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <SidebarInset className="flex-1">
          <TopNavbar />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
