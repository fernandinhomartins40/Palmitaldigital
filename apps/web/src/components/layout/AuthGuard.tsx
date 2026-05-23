import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from '@palmital/ui';
import { useAuthStore } from '../../store/authStore';
import { getLoginPath } from '../../utils/pwa';

export function AuthGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={getLoginPath(location.pathname)} replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
