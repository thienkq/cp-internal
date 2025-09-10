import { getUser } from '@workspace/supabase';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopNavbar } from '@/components/layout/top-navbar';
import {
  SidebarProvider,
  SidebarInset,
} from '@workspace/ui/components/sidebar';
import ProtectedComponent from '@/components/member/protected-component';

export default async function LeaveRequestDashboard({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  
  return (
    <ProtectedComponent user={user}>
      <SidebarProvider>
        <div className='flex min-h-screen w-full'>
          <AppSidebar />
          <SidebarInset className='flex-1'>
            <TopNavbar user={user} />
            {children}
          </SidebarInset>
        </div>
      </SidebarProvider>
    </ProtectedComponent>
  );
}
