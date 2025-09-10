import { getCurrentUser } from '@workspace/supabase';
import { PageContainer } from '@workspace/ui/components/page-container';
import { EnhancedLeaveBalanceSection } from '@/components/dashboard/enhanced-leave-balance-section';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { ArrowLeft } from 'lucide-react';

export default async function LeaveBalanceDetailsPage() {
  const { user } = await getCurrentUser();

  return (
    <PageContainer>
      {/* Header with back button */}
      <div className='flex flex-col gap-4 mb-6'>
        <Link href='/dashboard'>
          <Button variant='outline' size='sm'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            Back to Dashboard
          </Button>
        </Link>
        <div>
          <h1 className='text-2xl font-bold'>Leave Balance Details</h1>
          <p className='text-muted-foreground'>
            Complete analysis of your leave entitlement and tenure calculations
          </p>
        </div>
      </div>

      {/* Enhanced Leave Balance Analysis */}
      <EnhancedLeaveBalanceSection userId={user?.id as string} />
    </PageContainer>
  );
}
