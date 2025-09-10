import type { User } from '@workspace/supabase';
import { redirect } from 'next/navigation';
import React from 'react';
import { AuthenticationProvider } from './context';

const ProtectedComponent = ({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) => {

  if (!user) {
    return redirect('/auth/login');
  }

  
  return (
    <>
      <AuthenticationProvider user={user}>{children}</AuthenticationProvider>
    </>
  );
};

export default ProtectedComponent;
