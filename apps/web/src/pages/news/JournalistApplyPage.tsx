import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Clock, XCircle, Send } from 'lucide-react';
import { newsApi, type JournalistApplication } from '../../services/newsApi';
import { useAuthStore } from '../../store/authStore';

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: 'Em análise', color: 'var(--amber)' },
  APPROVED: { icon: CheckCircle, label: 'Aprovado!', color: 'var(--mint)' },
  REJECTED: { icon: XCircle, label: 'Rejeitado', color: 'var(--coral)' },
};

export function JournalistApplyPage() {
  const user = useAuthStore((s) => s.user);
  const isJournalist = user?.role === 'JOURNALIST' || user?.role === 'ADMIN';

  const [existing, setExisting] = useState<JournalistApplication | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [motivation, setMotivation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    newsApi.getMyApplication()
      .then((r) => setExisting(r.data))
      .catch(() => {})
      .finally(() => setLoadingExisting(false));
  }, []);

  const submit = async () => {
    if (!bio.trim() || !motivation.trim()) return;
    setSubmitting(true);
    try {
      const r = await newsApi.applyJournalist({
        bio: bio.trim(),
        portfolio: portfolio.trim(),
        motivation: motivation.trim(),
      });
      setExisting(r.data);
      setSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (isJournalist) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="halo halo-magenta glass rounded-3xl p-8 text-center space-y-4">
          <p className="text-4xl">✅</p>
          <p className="font-bold text-xl text-ink">Você já é jornalista!</p>
          <p className="text-mute text-sm">Seu credenciamento foi aprovado. Agora você pode criar artigos.</p>
          <Link to="/news/write" className="btn-ink inline-flex">Escrever artigo</Link>
        </div>
      </div>
    );
  }

  if (loadingExisting) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="glass rounded-3xl h-64 animate-pulse" />
      </div>
    );
  }

  if (existing) {
    const cfg = STATUS_CONFIG[existing.status as keyof typeof STATUS_CONFIG];
    const Icon = cfg?.icon ?? Clock;
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Link to="/news" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Portal de notícias
        </Link>
        <div className="halo halo-magenta glass rounded-3xl p-8 text-center space-y-4">
          <Icon className="w-12 h-12 mx-auto" style={{ color: cfg?.color }} />
          <div>
            <p className="font-bold text-xl text-ink">{cfg?.label ?? existing.status}</p>
            <p className="text-mute text-sm mt-1">
              Candidatura enviada em{' '}
              {new Date(existing.createdAt).toLocaleDateString('pt-BR')}
            </p>
          </div>
          {existing.status === 'PENDING' && (
            <p className="text-mute text-sm glass-strong rounded-2xl p-3">
              Nossa equipe editorial vai analisar seu pedido em breve. Você será notificado quando houver resposta.
            </p>
          )}
          {existing.status === 'APPROVED' && (
            <Link to="/news/write" className="btn-ink inline-flex">Começar a escrever</Link>
          )}
          {existing.status === 'REJECTED' && (
            <p className="text-mute text-sm glass-strong rounded-2xl p-3">
              Sua candidatura foi rejeitada. Entre em contato com a administração para mais informações.
            </p>
          )}
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="halo halo-magenta glass rounded-3xl p-8 text-center space-y-4">
          <p className="text-4xl">🎉</p>
          <p className="font-bold text-xl text-ink">Candidatura enviada!</p>
          <p className="text-mute text-sm">Nossa equipe editorial vai analisar seu pedido em breve.</p>
          <Link to="/news" className="btn-ink inline-flex">Voltar ao portal</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
      <Link to="/news" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Portal de notícias
      </Link>

      <div className="halo halo-magenta glass rounded-3xl p-6 space-y-2">
        <h1 className="text-xl font-bold text-ink">Quero ser jornalista</h1>
        <p className="text-mute text-sm">
          Credenciamento editorial — preencha o formulário e aguarde aprovação do admin.
        </p>
      </div>

      <div className="glass rounded-3xl p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-mute">Bio profissional *</label>
          <textarea
            className="w-full glass-strong rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50 resize-none"
            rows={4}
            placeholder="Quem é você? Sua experiência como jornalista, blogueiro ou comunicador..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-mute">Portfólio / links</label>
          <textarea
            className="w-full glass-strong rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50 resize-none"
            rows={3}
            placeholder="Links de trabalhos anteriores, blog, redes sociais profissionais..."
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-mute">Por que quer publicar aqui? *</label>
          <textarea
            className="w-full glass-strong rounded-2xl px-4 py-3 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50 resize-none"
            rows={4}
            placeholder="O que você quer trazer para a comunidade de Palmital? Que tipo de conteúdo pretende criar?"
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
          />
        </div>

        <button
          onClick={submit}
          disabled={submitting || !bio.trim() || !motivation.trim()}
          className="btn-ink w-full flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Enviando...' : 'Enviar candidatura'}
        </button>
      </div>

      {/* Info */}
      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-xs font-mono uppercase tracking-wider text-mute">Como funciona</p>
        {[
          'Envie o formulário com sua bio e motivação',
          'Admin analisa e aprova ou rejeita',
          'Aprovado: seu cargo muda para JOURNALIST',
          'Acesso total ao editor de artigos',
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-ink/80">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ background: 'color-mix(in srgb, var(--magenta) 15%, transparent)', color: 'var(--magenta)' }}
            >
              {i + 1}
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
