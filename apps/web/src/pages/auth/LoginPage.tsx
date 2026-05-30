import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { connectSocket } from '../../services/socket';
import { ToastContainer } from '../../components/shared/Toast';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [stayConnected, setStayConnected] = useState(true);
  const [error, setError] = useState('');

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.accessToken, data.refreshToken, data.user);
      connectSocket();
      addToast('Bem-vindo de volta!', 'success');
      navigate('/feed');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'E-mail ou senha incorretos.';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
      addToast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      <ToastContainer />

      {/* Halos de fundo */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-10 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[120px]" style={{ background: '#FF5B49' }} />
        <div className="absolute right-[-10rem] top-[40%] h-[26rem] w-[26rem] rounded-full opacity-20 blur-[120px]" style={{ background: '#3D5AFE' }} />
        <div className="absolute bottom-[-8rem] left-[40%] h-[22rem] w-[22rem] rounded-full opacity-20 blur-[120px]" style={{ background: '#5EEAD4' }} />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          {/* Branding */}
          <div className="hidden lg:block">
            <div className="halo halo-coral inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-surface">
              <span className="font-display text-2xl font-black">P</span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-ink">
              Bem-vindo<br />de volta.
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-mute">
              A rede da sua cidade. Sem ruído de fora, sem azul-genérico, sem promessa vazia.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { c: 'bg-coral', t: 'Feed da comunidade local' },
                { c: 'bg-citrus', t: 'Mercado de compra e venda' },
                { c: 'bg-cobalt', t: 'Empresas e serviços perto de você' },
                { c: 'bg-magenta', t: 'Conversas privadas em tempo real' },
              ].map((item) => (
                <div key={item.t} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${item.c}`} />
                  <CheckCircle2 size={15} className="text-mute" />
                  <span className="text-sm text-ink">{item.t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="glass shape-signature-lg p-6 sm:p-8">
            <div className="mb-6 lg:hidden">
              <div className="halo halo-coral inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-surface">
                <span className="font-display text-xl font-black">P</span>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-ink lg:text-3xl">
              Entrar na sua conta
            </h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
              Palmital Digital
            </p>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="login-email" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  E-mail
                </label>
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="seu@email.com"
                  className="w-full rounded-2xl border border-line bg-ink/[0.03] px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-semibold uppercase tracking-wider text-mute">
                    Senha
                  </label>
                  <a href="#" className="text-xs font-bold text-coral hover:underline">
                    Esqueci
                  </a>
                </div>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={form.password}
                    onChange={set('password')}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-line bg-ink/[0.03] px-4 py-3 pr-11 text-sm text-ink outline-none transition-all placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15 dark:bg-white/[0.04]"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mute transition-colors hover:text-ink"
                    aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <label className="flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    id="remember-me"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-line"
                  />
                  <span className="text-sm text-ink">Lembrar meus dados</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2.5 select-none">
                  <input
                    id="stay-connected"
                    type="checkbox"
                    checked={stayConnected}
                    onChange={(e) => setStayConnected(e.target.checked)}
                    className="h-4 w-4 cursor-pointer rounded border-line"
                  />
                  <span className="text-sm text-ink">Manter conectado</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                id="login-submit"
                className="halo halo-coral relative flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-bold text-surface transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Entrando...
                  </>
                ) : (
                  <>
                    <LogIn size={18} strokeWidth={2.4} />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-mute">
              Não tem conta?{' '}
              <Link to="/register" className="font-bold text-coral hover:underline">
                Cadastrar
              </Link>
            </p>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-mute">
              <Link to="/" className="hover:text-ink">← Página inicial</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
