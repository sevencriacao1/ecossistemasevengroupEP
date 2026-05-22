import React from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types/learning';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { session, profile, isLoading, signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (profile?.status === 'inativo') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-white">
        <section className="max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center shadow-premium">
          <h1 className="text-2xl font-semibold">Acesso inativo</h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Seu perfil esta inativo. Fale com o administrador para reativar o acesso ao Ecossistema.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-6 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
          >
            Sair
          </button>
        </section>
      </main>
    );
  }

  if (requiredRole && !profile) {
    return <Navigate to="/home" state={{ dashboardUnavailable: true }} replace />;
  }

  if (requiredRole && profile && profile.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
