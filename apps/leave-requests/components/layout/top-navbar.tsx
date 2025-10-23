'use client';
import { UserDropdownMenu } from '@/components/user-dropdown-menu';
import { useEffect, useState } from 'react';

interface NextAuthUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
}

interface TopNavbarProps {
  user?: NextAuthUser | null;
  pageTitle?: string;
}

export function TopNavbar({
  user,
  pageTitle = 'CoderPush Leaves',
}: TopNavbarProps) {
  const userProfile = user?.role ? {
    role: user.role as 'employee' | 'manager' | 'admin',
  } : null;
  return (
    <header className='border-b bg-background px-6 py-3'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <span className='text-sm text-muted-foreground'>{pageTitle}</span>
        </div>

        <div className='flex items-center gap-3'>
          <UserDropdownMenu user={user} userProfile={userProfile} />
        </div>
      </div>
    </header>
  );
}
