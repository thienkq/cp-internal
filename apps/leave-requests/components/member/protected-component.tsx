import { redirect } from 'next/navigation';
import React from 'react';
import { AuthenticationProvider } from './context';

interface NextAuthUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
}

const ProtectedComponent = ({
  user,
  children,
}: {
  user: NextAuthUser | null | undefined;
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
