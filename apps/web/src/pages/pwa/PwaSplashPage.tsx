import { useEffect, useState } from 'react';
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
    <main className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-canvas px-8 text-ink">
      {/* Halos de fundo */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full opacity-30 blur-[120px]" style={{ background: '#FF5B49' }} />
        <div className="absolute right-[-10rem] top-[40%] h-[26rem] w-[26rem] rounded-full opacity-25 blur-[120px]" style={{ background: '#3D5AFE' }} />
        <div className="absolute bottom-[-8rem] left-[40%] h-[22rem] w-[22rem] rounded-full opacity-25 blur-[120px]" style={{ background: '#5EEAD4' }} />
      </div>

      <div className="relative flex w-full max-w-xs flex-col items-center text-center">
        <div
          className="pwa-logo-pulse halo halo-coral relative flex h-24 w-24 items-center justify-center bg-ink text-surface shadow-2xl"
          style={{ borderRadius: '28px 28px 8px 28px' }}
        >
          <span className="font-display text-5xl font-black">P</span>
        </div>

        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight text-ink">
          Palmital Digital
        </h1>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-mute">
          Sua cidade sempre perto
        </p>

        <div className="mt-12 h-1.5 w-44 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
          <div className="pwa-splash-progress h-full rounded-full bg-coral" />
        </div>
      </div>
    </main>
  );
}
