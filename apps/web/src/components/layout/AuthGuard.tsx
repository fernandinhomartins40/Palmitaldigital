import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { Spinner } from '@palmital/ui';
import { useAuthStore } from '../../store/authStore';

export function AuthGuard({ children }: { children: ReactNode }) {
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
