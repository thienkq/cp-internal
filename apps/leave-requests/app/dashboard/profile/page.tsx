import { getCurrentUser } from '@/lib/auth-utils';
import { redirect } from 'next/navigation';
import { PageContainer } from '@workspace/ui/components/page-container';
import ProfilePageClient from './page.client';
import { getDb } from '@/db';
import { users, addresses } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { User, Address } from '@/types';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  const userId = user?.id as string;

  const db = getDb();

  const [userData] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
    
  const addressData = await db
    .select()
    .from(addresses)
    .where(eq(addresses.user_id, userId));


  if (!userData) {
    return redirect('/auth/login');
  }

  return (
    <PageContainer>
      <ProfilePageClient
        userData={userData as User}
        addressData={(addressData as Address[]) || [] }
        userId={userId}
      />
    </PageContainer>
  );
}
