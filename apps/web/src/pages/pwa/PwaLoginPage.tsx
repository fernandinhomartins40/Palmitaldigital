import { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { ToastContainer } from '../../components/shared/Toast';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export function PwaLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const addToast = useUIStore((s) => s.addToast);
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const redirectTo =
    typeof location.state?.from === 'string' && !location.state.from.includes('/login')
      ? location.state.from
      : '/feed';

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  function set(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.accessToken, data.refreshToken, data.user);
      connectSocket();
      addToast('Login realizado', 'success');
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      const message = err.response?.data?.message || 'E-mail ou senha incorretos.';
      const display = Array.isArray(message) ? message.join(', ') : message;
      setError(display);
      addToast(display, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-canvas px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))] text-ink">
      <ToastContainer />

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[120px]" style={{ background: '#FF5B49' }} />
        <div className="absolute right-[-10rem] top-[40%] h-[26rem] w-[26rem] rounded-full opacity-20 blur-[120px]" style={{ background: '#3D5AFE' }} />
      </div>

      <section className="relative flex flex-1 flex-col justify-center">
        <div className="mb-9">
          <div
            className="halo halo-coral flex h-16 w-16 items-center justify-center bg-ink text-surface shadow-2xl"
            style={{ borderRadius: '24px 24px 6px 24px' }}
          >
            <span className="font-display text-3xl font-black">P</span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink">
            Palmital Digital
          </h1>
          <p className="mt-2 max-w-xs font-mono text-[11px] uppercase tracking-wider text-mute">
            Feed · Mensagens · Mercado
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="seu@email.com"
              className="h-12 w-full rounded-2xl border border-line bg-ink/[0.03] px-4 text-[16px] font-medium text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-mute">Senha</span>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Sua senha"
                className="h-12 w-full rounded-2xl border border-line bg-ink/[0.03] px-4 pr-12 text-[16px] font-medium text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
              />
              <button
                type="button"
                aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setShowPass((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-mute transition hover:bg-ink/5 hover:text-ink"
              >
                {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="halo halo-coral flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-bold text-surface transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Entrando
              </>
            ) : (
              <>
                <LogIn size={18} strokeWidth={2.4} />
                Entrar no app
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
