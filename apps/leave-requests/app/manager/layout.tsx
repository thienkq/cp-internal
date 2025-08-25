import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@workspace/supabase";
import { ManagerSidebar } from "@/components/layout/manager-sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { SidebarProvider, SidebarInset } from "@workspace/ui/components/sidebar";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  // Get the current auth user and supabase client
  const { user, supabase } = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch the user's role from the users table
  const { data: userData, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Error fetching user data:", error);
    notFound();
  }

  // Allow both managers and admins to access manager dashboard
  if (!userData?.role || !["manager", "admin"].includes(userData.role)) {
    notFound();
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <ManagerSidebar />
        <SidebarInset className="flex-1">
          <TopNavbar user={user} pageTitle="Manager Dashboard" />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}