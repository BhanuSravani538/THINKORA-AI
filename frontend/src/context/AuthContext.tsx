import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: { email: string; password: string; fullName: string; role?: string }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('thinkora_user');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // ignore error
        }
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || localStorage.getItem('auth_token') || null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const initializeAuth = async () => {
      const existingToken =
        typeof window !== 'undefined'
          ? localStorage.getItem('token') || localStorage.getItem('auth_token')
          : null;

      if (!existingToken) {
        if (isMounted) {
          setUser(null);
          setToken(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const currentUser = await api.getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            setUser(currentUser);
            setToken(existingToken);
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } catch (err) {
        if (isMounted) {
          const cached = localStorage.getItem('thinkora_user');
          if (cached) {
            try {
              setUser(JSON.parse(cached));
              setToken(existingToken);
            } catch {
              setUser(null);
              setToken(null);
            }
          } else {
            setUser(null);
            setToken(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await api.login(credentials);
    if (res.token) {
      setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
  };

  const register = async (payload: { email: string; password: string; fullName: string; role?: string }) => {
    const res = await api.register(payload);
    if (res.token) {
      setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
