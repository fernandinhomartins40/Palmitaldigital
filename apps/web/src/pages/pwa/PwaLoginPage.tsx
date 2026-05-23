import { useEffect, useState } from 'react';
import { AlertCircle, Eye, EyeOff, LogIn, MapPin } from 'lucide-react';
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
      addToast('Login realizado com sucesso', 'success');
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
    <main className="flex min-h-[100dvh] flex-col bg-[linear-gradient(180deg,#eff6ff_0%,#ffffff_48%,#ecfeff_100%)] px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
      <ToastContainer />

      <section className="flex flex-1 flex-col justify-center">
        <div className="mb-9">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-blue-600 text-white shadow-xl shadow-blue-200">
            <MapPin size={31} strokeWidth={2.4} />
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
            Palmital Digital
          </h1>
          <p className="mt-2 max-w-xs text-sm font-medium leading-6 text-slate-500">
            Entre para acompanhar o feed, mensagens e negocios locais.
          </p>
        </div>

        {error ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-700">E-mail</span>
            <input
              type="email"
              autoComplete="email"
              inputMode="email"
              required
              value={form.email}
              onChange={set('email')}
              placeholder="seu@email.com"
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[16px] font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-sm font-bold text-slate-700">Senha</span>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={set('password')}
                placeholder="Digite sua senha"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 pr-12 text-[16px] font-medium text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                onClick={() => setShowPass((current) => !current)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 text-sm font-black text-white shadow-xl shadow-blue-200 transition active:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Entrando
              </>
            ) : (
              <>
                <LogIn size={18} />
                Entrar no app
              </>
            )}
          </button>
        </form>
      </section>
    </main>
  );
}
