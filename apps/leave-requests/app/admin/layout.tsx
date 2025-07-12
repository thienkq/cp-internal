import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@workspace/supabase";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // 1. Get the current auth user and supabase client
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login"); // Not logged in, redirect to login
  }

  // 2. Fetch the user's role from your users table
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userData?.role !== "admin") {
    notFound(); // Not an admin, show 404
  }

  // 3. Render the admin layout
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
  );
} 