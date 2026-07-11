import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { User } from '@devcollab/shared-types';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in (cookie present)
    const checkAuth = async () => {
      try {
        const response = await api.get<User>('/api/users/me');
        setCurrentUser(response.data);
      } catch (error) {
        // Not logged in or token expired
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for unauthorized events emitted by the API interceptor
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = (user: User) => {
    setCurrentUser(user);
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    }
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout }}>
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
