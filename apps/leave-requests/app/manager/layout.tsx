import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth-utils';
import { ManagerSidebar } from '@/components/layout/manager-sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import {
  SidebarProvider,
  SidebarInset,
} from '@workspace/ui/components/sidebar';
import { getManagerUser } from '@/lib/user-db-utils';

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get the current auth user
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Fetch the user's data and validate manager/admin role using Drizzle ORM
  try {
    await getManagerUser(user.id);
  } catch (error) {
    console.error('Error fetching user data:', error);
    notFound(); // Not a manager/admin or user not found, show 404
  }

  return (
    <SidebarProvider>
      <div className='flex min-h-screen w-full'>
        <ManagerSidebar />
        <SidebarInset className='flex-1'>
          <TopNavbar user={user} pageTitle='Manager Dashboard' />
          {children}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
