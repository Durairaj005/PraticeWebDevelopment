import { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'hod' | 'admin';
  profile_picture_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string) => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await api.get('/users/me');
      setUser(response.data);
      return response.data as User;
    } catch (_) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('token', token);
    return fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
