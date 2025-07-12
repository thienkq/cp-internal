import { getUser } from "@workspace/supabase"

import { AdminSidebar } from "@/components/layout/admin-sidebar"
import { TopNavbar } from "@/components/layout/top-navbar"
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AdminSidebar />
        <SidebarInset className="flex-1">
          <TopNavbar user={user} pageTitle="Admin Panel" />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
} 