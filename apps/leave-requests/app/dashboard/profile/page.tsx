import { getCurrentUser } from '@workspace/supabase';
import { redirect } from 'next/navigation';
import { PageContainer } from '@workspace/ui/components/page-container';
import ProfilePageClient from './page.client';

export default async function ProfilePage() {
  const { user, supabase } = await getCurrentUser();

  const userId = user?.id as string;

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  const { data: addressData } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId);

  if (!userData) {
    return redirect('/auth/login');
  }

  return (
    <PageContainer>
      <ProfilePageClient
        userData={userData}
        addressData={addressData || []}
        userId={userId}
      />
    </PageContainer>
  );
}
