import React, { createContext, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import type { User } from '../store/authStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (credentials: any) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useAuthStore();

  useEffect(() => {
    store.checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{
      user: store.user,
      loading: store.loading,
      error: store.error,
      login: store.login,
      signup: store.signup,
      logout: store.logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
