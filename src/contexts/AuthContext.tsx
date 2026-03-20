import { apiRequest } from '@/lib/api';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthError {
  message: string;
}

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
}

interface Session {
  user: User;
}

interface SignUpPayload {
  email: string;
  password: string;
  displayName: string;
  phone: string;
  cpf: string;
  documentId: string;
  companyName: string;
  tenantSlug: string;
}

interface ProfilePayload {
  display_name: string;
  phone: string | null;
  cpf: string | null;
  avatar_url?: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (payload: SignUpPayload) => Promise<{ error: AuthError | null }>;
  requestPasswordReset: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (payload: ProfilePayload) => Promise<{ error: AuthError | null }>;
  resendVerificationEmail: (email: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

const withErrorBoundary = async <T,>(fn: () => Promise<T>): Promise<{ data?: T; error: AuthError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    return { error: { message: error instanceof Error ? error.message : 'Erro inesperado.' } };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadSession = async () => {
    setLoading(true);
    const { data, error } = await withErrorBoundary(() => apiRequest<{ session: Session | null; isAdmin: boolean }>('auth/session'));
    if (!error && data) {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setIsAdmin(data.isAdmin);
    } else {
      setSession(null);
      setUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  useEffect(() => {
    void loadSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await withErrorBoundary(async () => {
      const payload = await apiRequest<{ session: Session; isAdmin: boolean }>('auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setSession(payload.session);
      setUser(payload.session.user);
      setIsAdmin(payload.isAdmin);
      return payload;
    });
    return { error };
  };

  const signUp = async (payload: SignUpPayload) => {
    const { error } = await withErrorBoundary(() => apiRequest('auth/register', { method: 'POST', body: JSON.stringify(payload) }));
    return { error };
  };

  const requestPasswordReset = async (email: string) => {
    const { error } = await withErrorBoundary(() => apiRequest('auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }));
    return { error };
  };

  const updatePassword = async (password: string) => {
    const { error } = await withErrorBoundary(() => apiRequest('auth/reset-password', { method: 'POST', body: JSON.stringify({ password }) }));
    return { error };
  };

  const updateProfile = async (payload: ProfilePayload) => {
    const { error } = await withErrorBoundary(() => apiRequest('profile', { method: 'PUT', body: JSON.stringify(payload) }));
    return { error };
  };

  const resendVerificationEmail = async (email: string) => {
    const { error } = await withErrorBoundary(() => apiRequest('auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }));
    return { error };
  };

  const signOut = async () => {
    await apiRequest('auth/logout', { method: 'POST' });
    setSession(null);
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signIn, signUp, requestPasswordReset, updatePassword, updateProfile, resendVerificationEmail, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
