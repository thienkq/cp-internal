'use client';

import { createContext, useContext } from 'react';
import type { User } from '@workspace/supabase';

export type AuthenticationContextType = {
  user: User;
};
const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

// Provider component
export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
  user: User;
}> = ({ children, user }) => {
  // Context value
  const contextValue: AuthenticationContextType = {
    user,
  };

  return (
    <AuthenticationContext.Provider value={contextValue}>
      {children}
    </AuthenticationContext.Provider>
  );
};

// Custom hook to use the context
export const useAuthenticationContext = (): AuthenticationContextType => {
  const context = useContext(AuthenticationContext);
  if (context === undefined) {
    throw new Error(
      'useAuthenticationContext must be used within a AuthenticationContext'
    );
  }
  return context;
};

// Export the context for advanced use cases
export { AuthenticationContext };
