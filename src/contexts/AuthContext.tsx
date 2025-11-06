import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { loginUser, registerUser, getCurrentUser, getUserData } from '@/lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  is_admin?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUserData: () => Promise<any>;
  getUserDataCache: () => any;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token and user from localStorage on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      // Verify token is still valid
      getCurrentUser(storedToken).catch(() => {
        // Token invalid, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        setToken(null);
        setUser(null);
      });
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    const response = await loginUser(username, password) as any;
    const { access_token, user: userData } = response;
    
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
    // Load user data immediately after login
    try {
      const data = await getUserData(access_token);
      if (data) {
        localStorage.setItem('user_data_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to load user data on login:', err);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    const response = await registerUser(username, email, password) as any;
    const { access_token, user: userData } = response;
    
    setToken(access_token);
    setUser(userData);
    localStorage.setItem('auth_token', access_token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    
    // Load user data immediately after registration (will be empty for new user)
    try {
      const data = await getUserData(access_token);
      if (data) {
        localStorage.setItem('user_data_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Failed to load user data on register:', err);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_data_cache');
  };

  const loadUserData = async () => {
    if (!token) {
      // Try to get from cache
      const cached = localStorage.getItem('user_data_cache');
      return cached ? JSON.parse(cached) : null;
    }
    try {
      const data = await getUserData(token);
      // Cache the data
      if (data) {
        localStorage.setItem('user_data_cache', JSON.stringify(data));
      }
      return data;
    } catch (error) {
      console.error('Failed to load user data:', error);
      // Try cache as fallback
      const cached = localStorage.getItem('user_data_cache');
      return cached ? JSON.parse(cached) : null;
    }
  };
  
  const getUserDataCache = () => {
    const cached = localStorage.getItem('user_data_cache');
    return cached ? JSON.parse(cached) : null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        loadUserData,
        getUserDataCache,
        isAuthenticated: !!user && !!token,
      }}
    >
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

