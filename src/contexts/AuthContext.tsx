import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Company, UserProfile, UserRole, UserStatus } from '../types/learning';

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  company: Company | null;
  role: UserRole | null;
  signIn: (username: string, password: string) => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const profileRequests = new Map<string, Promise<UserProfile | null>>();

function normalizeRole(value: unknown): UserRole {
  return value === 'admin' ? 'admin' : 'colaborador';
}

function normalizeCompany(value: unknown): Company {
  return value === 'ARQO' ? 'ARQO' : 'Seven';
}

function normalizeStatus(value: unknown): UserStatus {
  return value === 'inativo' ? 'inativo' : 'ativo';
}

function normalizeProfile(rawProfile: Record<string, unknown>): UserProfile {
  const email = typeof rawProfile.email === 'string' ? rawProfile.email : null;
  const username =
    typeof rawProfile.username === 'string'
      ? rawProfile.username
      : email?.split('@')[0] ?? 'usuario';

  return {
    id: String(rawProfile.id),
    email,
    username,
    full_name: typeof rawProfile.full_name === 'string'
      ? rawProfile.full_name
      : typeof rawProfile.nome === 'string'
        ? rawProfile.nome
        : null,
    avatar_url: typeof rawProfile.avatar_url === 'string' ? rawProfile.avatar_url : null,
    role: normalizeRole(rawProfile.role ?? rawProfile.nivel_acesso),
    company: normalizeCompany(rawProfile.company ?? rawProfile.empresa),
    status: normalizeStatus(rawProfile.status),
  };
}

async function loadProfile(userId: string): Promise<UserProfile | null> {
  const currentRequest = profileRequests.get(userId);

  if (currentRequest) {
    return currentRequest;
  }

  const request = Promise.resolve(
    supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
  )
    .then(({ data, error }) => {
      if (error) {
        console.error('Erro ao carregar perfil:', error);
        return null;
      }

      return normalizeProfile(data as Record<string, unknown>);
    })
    .finally(() => {
      profileRequests.delete(userId);
    });

  profileRequests.set(userId, request);
  return request;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const lastProfileUserId = React.useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const syncSession = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);

      if (nextSession?.user.id) {
        if (lastProfileUserId.current === nextSession.user.id) return;

        const nextProfile = await loadProfile(nextSession.user.id);
        if (isMounted) {
          setProfile(nextProfile);
          lastProfileUserId.current = nextProfile?.id ?? null;
        }
      } else {
        lastProfileUserId.current = null;
        setProfile(null);
      }
    };

    supabase.auth
      .getSession()
      .then(async ({ data, error }) => {
        if (error) {
          await supabase.auth.signOut({ scope: 'local' });
          await syncSession(null);
          return;
        }

        await syncSession(data.session);
      })
      .catch(async () => {
        await supabase.auth.signOut({ scope: 'local' });
        await syncSession(null);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void syncSession(nextSession);
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (username: string, password: string) => {
    const normalizedUsername = username.trim().toLowerCase();
    const { data: resolvedEmail, error: resolveError } = await supabase
      .rpc('resolve_login_email', { input_username: normalizedUsername });

    if (resolveError || !resolvedEmail) {
      throw new Error('Credenciais inválidas. Tente novamente.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    if (error) {
      throw new Error('Credenciais inválidas. Tente novamente.');
    }

    setSession(data.session);
    const nextProfile = data.user ? await loadProfile(data.user.id) : null;
    lastProfileUserId.current = nextProfile?.id ?? null;
    setProfile(nextProfile);
    return nextProfile;
  };

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => supabase.auth.signOut({ scope: 'local' }));
    lastProfileUserId.current = null;
    setSession(null);
    setProfile(null);
  };

  const value = useMemo<AuthContextType>(() => ({
    session,
    user: profile,
    profile,
    isLoading,
    isAdmin: profile?.role === 'admin',
    company: profile?.company ?? null,
    role: profile?.role ?? null,
    signIn,
    signOut,
  }), [session, profile, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
