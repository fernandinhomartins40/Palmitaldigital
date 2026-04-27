import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, MapPin, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import { connectSocket } from '../../services/socket';
import { ToastContainer } from '../../components/shared/Toast';

/* ── Password strength logic ── */
type Strength = 'fraca' | 'média' | 'forte' | 'muito forte';

interface PasswordAnalysis {
  score: number; // 0-4
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
    0: { strength: 'fraca', color: 'text-red-600', barColor: 'bg-red-500' },
    1: { strength: 'fraca', color: 'text-red-600', barColor: 'bg-red-500' },
    2: { strength: 'média', color: 'text-amber-600', barColor: 'bg-amber-400' },
    3: { strength: 'forte', color: 'text-emerald-600', barColor: 'bg-emerald-500' },
    4: { strength: 'muito forte', color: 'text-emerald-700', barColor: 'bg-emerald-600' },
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
  const passwordMeetsMinReqs = analysis.checks.slice(0, 3).every((c) => c.ok); // first 3 are required

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
      setError('Sua senha não atende aos requisitos mínimos de segurança.');
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
      addToast('Conta criada com sucesso! Bem-vindo(a) 🎉', 'success');
      navigate('/');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      const display = Array.isArray(msg) ? msg.join(', ') : msg;
      setError(display);
      addToast(display, 'error');
    } finally {
      setLoading(false);
    }
  }

  const showPassError = touched.password && form.password.length > 0 && !passwordMeetsMinReqs;
  const showMatchError = touched.confirmPassword && form.confirmPassword.length > 0 && !passwordsMatch;

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <ToastContainer />
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
        <div className="max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-6">
            <MapPin size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-extrabold mb-3">Junte-se à comunidade!</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Crie sua conta gratuitamente e conecte-se com toda a cidade de Palmital.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-sm text-blue-100">
            {['Cadastro 100% gratuito', 'Sem anúncios invasivos', 'Dados protegidos e seguros', 'Suporte em português'].map(
              (item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-300 flex-shrink-0" />
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Right – register form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 overflow-y-auto">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-3">
              <MapPin size={24} className="text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-blue-700">Palmital Digital</h1>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Criar conta grátis</h2>
            <p className="mt-1 text-sm text-gray-500">Leva menos de 1 minuto</p>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display name */}
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-name" className="text-sm font-semibold text-gray-700">
                Nome completo
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all
                  placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-email" className="text-sm font-semibold text-gray-700">
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
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all
                  placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-password" className="text-sm font-semibold text-gray-700">
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
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition-all
                    placeholder:text-gray-400 focus:ring-2
                    ${showPassError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  aria-label={showPass ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Strength bar */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                          i <= analysis.score ? analysis.barColor : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-semibold ${analysis.color}`}>
                    Força: {analysis.strength}
                  </p>
                </div>
              )}

              {/* Password requirements */}
              {(touched.password || form.password.length > 0) && (
                <div className="mt-2 space-y-1">
                  {analysis.checks.map(({ label, ok }) => (
                    <div key={label} className={`flex items-center gap-1.5 text-xs ${ok ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {ok ? <CheckCircle2 size={12} className="flex-shrink-0" /> : <XCircle size={12} className="flex-shrink-0" />}
                      {label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-confirm" className="text-sm font-semibold text-gray-700">
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
                  className={`w-full rounded-xl border bg-white px-4 py-2.5 pr-11 text-sm text-gray-900 outline-none transition-all
                    placeholder:text-gray-400 focus:ring-2
                    ${showMatchError
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : form.confirmPassword && passwordsMatch
                      ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20'
                      : 'border-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                    }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  aria-label={showConfirm ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {showMatchError && (
                <p className="text-xs text-red-600 flex items-center gap-1 mt-0.5">
                  <AlertCircle size={11} /> As senhas não coincidem
                </p>
              )}
              {form.confirmPassword && passwordsMatch && touched.confirmPassword && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 size={11} /> Senhas conferem
                </p>
              )}
            </div>

            {/* Phone (optional) */}
            <div className="flex flex-col gap-1">
              <label htmlFor="reg-phone" className="text-sm font-semibold text-gray-700">
                Telefone{' '}
                <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={set('phone')}
                placeholder="(44) 99999-9999"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition-all
                  placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              id="register-submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800
                text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-blue-200
                disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Criando conta...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Criar conta
                </>
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Já tem conta?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Entrar
            </Link>
          </p>
          <p className="mt-3 text-center text-xs text-gray-400">
            <Link to="/" className="hover:text-gray-600 transition-colors">
              ← Voltar para a página inicial
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
