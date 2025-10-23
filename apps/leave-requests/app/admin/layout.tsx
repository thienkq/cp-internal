import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import {
  SidebarProvider,
  SidebarInset,
} from '@workspace/ui/components/sidebar';
import { getAdminUser } from '@/lib/user-db-utils';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Get the current auth user
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login'); // Not logged in, redirect to login
  }

  // 2. Fetch the user's data and validate admin role using Drizzle ORM
  try {
    await getAdminUser(user.id);
  } catch (error) {
    console.error('Error fetching user data:', error);
    notFound(); // Not an admin or user not found, show 404
  }

  // 3. Render the admin layout
  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <AdminSidebar />
        <SidebarInset className='flex-1'>
          <TopNavbar user={user} pageTitle='Admin Panel' />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
