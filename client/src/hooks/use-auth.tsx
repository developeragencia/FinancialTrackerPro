import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

type UserType = 'client' | 'merchant' | 'admin';

interface User {
  id: number;
  name: string;
  email: string;
  type: UserType;
  photo?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, type: UserType) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  userType: UserType | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to load user', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  const login = async (email: string, password: string, type: UserType) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
        type,
      });
      
      const userData = await response.json();
      setUser(userData);
      
      // Redirect based on user type
      if (type === 'client') {
        navigate('/client/dashboard');
      } else if (type === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (type === 'admin') {
        navigate('/admin/dashboard');
      }
      
      toast({
        title: 'Login realizado com sucesso',
        description: `Bem-vindo(a), ${userData.name}!`,
      });
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao fazer login',
        description: err.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any) => {
    setLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const data = await response.json();
      
      toast({
        title: 'Cadastro realizado com sucesso',
        description: 'Você já pode fazer login no sistema.',
      });
      
      navigate('/login');
    } catch (error) {
      const err = error as Error;
      toast({
        title: 'Erro ao cadastrar',
        description: err.message,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      navigate('/login');
      
      toast({
        title: 'Logout realizado',
        description: 'Você saiu do sistema com sucesso.',
      });
    } catch (error) {
      console.error('Logout error', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    userType: user?.type || null,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
