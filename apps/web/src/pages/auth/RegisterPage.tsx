import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { connectSocket } from '../../services/socket';
import { ToastContainer } from '../../components/shared/Toast';

type Strength = 'fraca' | 'média' | 'forte' | 'muito forte';

interface PasswordAnalysis {
  score: number;
  strength: Strength;
  color: string;
  barColor: string;
  checks: { label: string; ok: boolean }[];
}

function analyzePassword(pwd: string): PasswordAnalysis {
  const checks = [
    { label: 'Pelo menos 8 caracteres', ok: pwd.length >= 8 },
    { label: 'Uma letra maiúscula (A-Z)', ok: /[A-Z]/.test(pwd) },
    { label: 'Um caractere especial (!@#...)', ok: /[^A-Za-z0-9]/.test(pwd) },
    { label: 'Um número (0-9)', ok: /[0-9]/.test(pwd) },
  ];

  const score = checks.filter((c) => c.ok).length;

  const map: Record<number, { strength: Strength; color: string; barColor: string }> = {
    0: { strength: 'fraca', color: 'text-coral', barColor: 'bg-coral' },
    1: { strength: 'fraca', color: 'text-coral', barColor: 'bg-coral' },
    2: { strength: 'média', color: 'text-amber', barColor: 'bg-amber' },
    3: { strength: 'forte', color: 'text-mint', barColor: 'bg-mint' },
    4: { strength: 'muito forte', color: 'text-mint', barColor: 'bg-mint' },
  };

  return { score, checks, ...map[score] };
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const addToast = useUIStore((s) => s.addToast);

  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const analysis = useMemo(() => analyzePassword(form.password), [form.password]);
  const passwordsMatch = form.password === form.confirmPassword;
  const passwordMeetsMinReqs = analysis.checks.slice(0, 3).every((c) => c.ok);

  function set(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function touch(field: string) {
    return () => setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ displayName: true, email: true, password: true, confirmPassword: true });

    if (!passwordMeetsMinReqs) {
      setError('Sua senha não atende aos requisitos mínimos.');
      return;
    }
    if (!passwordsMatch) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const { password, confirmPassword: _, ...rest } = form;
      const payload = { ...rest, password, phone: form.phone || undefined };
      const { data } = await api.post('/auth/register', payload);
      setAuth(data.accessToken, data.refreshToken, data.user);
      connectSocket();
      addToast('Conta criada com sucesso!', 'success');
      navigate('/feed');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao criar conta.';
      const display = Array.isArray(msg) ? msg.join(', ') : msg;
      setError(display);
      addToast(display, 'error');
    } finally {
      setLoading(false);
    }
  }

  const showPassError = touched.password && form.password.length > 0 && !passwordMeetsMinReqs;
  const showMatchError = touched.confirmPassword && form.confirmPassword.length > 0 && !passwordsMatch;

  const inputBase =
    'w-full rounded-2xl border bg-ink/[0.03] px-4 py-3 text-sm text-ink outline-none transition-all placeholder:text-subtle dark:bg-white/[0.04]';
  const inputDefault = 'border-line focus:border-coral focus:bg-surface focus:ring-4 focus:ring-coral/15';
  const inputError = 'border-coral focus:ring-4 focus:ring-coral/20';
  const inputOk = 'border-mint focus:ring-4 focus:ring-mint/20';

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas text-ink">
      <ToastContainer />

      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -right-32 top-10 h-[28rem] w-[28rem] rounded-full opacity-25 blur-[120px]" style={{ background: '#E94FCB' }} />
        <div className="absolute left-[-10rem] top-[40%] h-[26rem] w-[26rem] rounded-full opacity-20 blur-[120px]" style={{ background: '#5EEAD4' }} />
        <div className="absolute bottom-[-8rem] right-[40%] h-[22rem] w-[22rem] rounded-full opacity-20 blur-[120px]" style={{ background: '#FFB020' }} />
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          {/* Form */}
          <div className="glass shape-signature-lg p-6 sm:p-8">
            <div className="mb-6 lg:hidden">
              <div className="halo halo-magenta inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-surface">
                <span className="font-display text-xl font-black">P</span>
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-ink lg:text-3xl">
              Criar conta
            </h2>
            <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-mute">
              Leva menos de 1 minuto
            </p>

            {error && (
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-coral">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-name" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Nome
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  minLength={2}
                  value={form.displayName}
                  onChange={set('displayName')}
                  onBlur={touch('displayName')}
                  placeholder="Seu nome"
                  className={`${inputBase} ${inputDefault}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-email" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  E-mail
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  onBlur={touch('email')}
                  placeholder="seu@email.com"
                  className={`${inputBase} ${inputDefault}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-password" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    required
                    value={form.password}
                    onChange={set('password')}
                    onBlur={touch('password')}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11 ${showPassError ? inputError : inputDefault}`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mute hover:text-ink"
                    aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {form.password.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= analysis.score ? analysis.barColor : 'bg-line'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`font-mono text-[10px] font-bold uppercase tracking-wider ${analysis.color}`}>
                      Força: {analysis.strength}
                    </p>
                  </div>
                )}

                {(touched.password || form.password.length > 0) && (
                  <div className="mt-2 space-y-1">
                    {analysis.checks.map(({ label, ok }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-1.5 text-xs ${ok ? 'text-mint dark:text-mint' : 'text-mute'}`}
                      >
                        {ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        {label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-confirm" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Confirmar senha
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    onBlur={touch('confirmPassword')}
                    placeholder="••••••••"
                    className={`${inputBase} pr-11 ${
                      showMatchError
                        ? inputError
                        : form.confirmPassword && passwordsMatch
                          ? inputOk
                          : inputDefault
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-mute hover:text-ink"
                    aria-label={showConfirm ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {showMatchError && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-coral">
                    <AlertCircle size={11} /> Senhas não coincidem
                  </p>
                )}
                {form.confirmPassword && passwordsMatch && touched.confirmPassword && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-mint">
                    <CheckCircle2 size={11} /> Senhas conferem
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="reg-phone" className="text-xs font-semibold uppercase tracking-wider text-mute">
                  Telefone <span className="font-normal text-subtle">(opcional)</span>
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  placeholder="(44) 99999-9999"
                  className={`${inputBase} ${inputDefault}`}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                id="register-submit"
                className="halo halo-magenta flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 font-bold text-surface transition-all hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-60 disabled:transform-none"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Criando...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} strokeWidth={2.4} />
                    Criar conta
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-mute">
              Já tem conta?{' '}
              <Link to="/login" className="font-bold text-coral hover:underline">
                Entrar
              </Link>
            </p>
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-wider text-mute">
              <Link to="/" className="hover:text-ink">← Página inicial</Link>
            </p>
          </div>

          {/* Branding direita */}
          <div className="hidden lg:block">
            <div className="halo halo-magenta inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-surface">
              <span className="font-display text-2xl font-black">P</span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold tracking-tight text-ink">
              Faça parte<br />de Palmital.
            </h1>
            <p className="mt-4 max-w-md text-lg leading-relaxed text-mute">
              Sua cidade num só lugar — feed, mercado, empresas e mensagens. Sem azul de banco.
            </p>
            <div className="mt-8 space-y-3">
              {[
                { c: 'bg-coral', t: 'Cadastro 100% gratuito' },
                { c: 'bg-citrus', t: 'Sem anúncios invasivos' },
                { c: 'bg-cobalt', t: 'Dados protegidos' },
                { c: 'bg-magenta', t: 'Suporte em português' },
              ].map((item) => (
                <div key={item.t} className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${item.c}`} />
                  <CheckCircle2 size={15} className="text-mute" />
                  <span className="text-sm text-ink">{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
