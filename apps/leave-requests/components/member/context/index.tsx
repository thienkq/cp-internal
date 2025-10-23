'use client';

import { createContext, useContext } from 'react';

interface NextAuthUser {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
}

export type AuthenticationContextType = {
  user: NextAuthUser;
};
const AuthenticationContext = createContext<
  AuthenticationContextType | undefined
>(undefined);

// Provider component
export const AuthenticationProvider: React.FC<{
  children: React.ReactNode;
  user: NextAuthUser;
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
