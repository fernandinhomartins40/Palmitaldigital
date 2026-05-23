import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function PwaSplashPage() {
  const navigate = useNavigate();
  const hasHydrated = useAuthStore((s) => s.hasHydrated);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 1500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasHydrated || !ready) return;
    navigate(isAuthenticated ? '/feed' : '/app/login', { replace: true });
  }, [hasHydrated, isAuthenticated, navigate, ready]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_18%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(155deg,#1d4ed8_0%,#2563eb_42%,#0f766e_100%)] px-8 text-white">
      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        <div className="absolute -top-24 h-48 w-48 rounded-full border border-white/15" />
        <div className="absolute -top-14 h-32 w-32 rounded-full border border-white/20" />

        <div className="pwa-logo-pulse relative flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/20 bg-white/16 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur">
          <MapPin size={46} strokeWidth={2.4} />
        </div>

        <h1 className="mt-8 text-3xl font-black tracking-tight">Palmital Digital</h1>
        <p className="mt-2 text-sm font-medium text-blue-50/88">Sua cidade sempre perto.</p>

        <div className="mt-12 h-1.5 w-44 overflow-hidden rounded-full bg-white/20">
          <div className="pwa-splash-progress h-full rounded-full bg-white" />
        </div>
      </div>
    </main>
  );
}
