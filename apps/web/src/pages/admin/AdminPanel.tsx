import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, UtensilsCrossed, Car, Newspaper,
  FileText, Users, CreditCard, CheckCircle, XCircle, Clock,
  BadgeCheck, AlertTriangle, ChevronRight, Search, RefreshCw,
  Star, ToggleLeft, ToggleRight, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/adminApi';
import type {
  AdminDashboard, AdminCompany, AdminRestaurant, AdminDriver,
  AdminJournalistApp, AdminArticle, AdminUser,
} from '../../services/adminApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Avatar({ name, url, size = 8 }: { name: string; url?: string | null; size?: number }) {
  const s = `h-${size} w-${size}`;
  if (url) return <img src={url} alt="" className={`${s} rounded-xl object-cover shrink-0`} />;
  return (
    <div className={`${s} rounded-xl bg-cobalt/20 flex items-center justify-center text-cobalt font-bold shrink-0`}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function StatusBadge({ verified, pending }: { verified?: boolean; pending?: boolean }) {
  if (pending) return <span className="chip text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><Clock size={9} />Pendente</span>;
  if (verified) return <span className="chip text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"><CheckCircle size={9} />Verificado</span>;
  return <span className="chip text-[10px] bg-ink/5 text-mute"><XCircle size={9} />Não verificado</span>;
}

function ActionBtn({ onClick, approve, loading }: { onClick: () => void; approve: boolean; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-opacity disabled:opacity-50 ${
        approve ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-coral text-white hover:opacity-80'
      }`}
    >
      {approve ? <CheckCircle size={12} /> : <XCircle size={12} />}
      {approve ? 'Aprovar' : 'Rejeitar'}
    </button>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const sections = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'companies', label: 'Empresas', icon: Building2 },
  { id: 'restaurants', label: 'Delivery', icon: UtensilsCrossed },
  { id: 'drivers', label: 'Motoristas', icon: Car },
  { id: 'journalists', label: 'Jornalistas', icon: Newspaper },
  { id: 'articles', label: 'Artigos', icon: FileText },
  { id: 'users', label: 'Usuários', icon: Users },
  { id: 'credits', label: 'Créditos & Planos', icon: CreditCard },
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

function DashboardSection({ data }: { data: AdminDashboard | null }) {
  if (!data) return <div className="animate-pulse h-40 rounded-2xl bg-ink/5" />;
  const stats = [
    { label: 'Usuários', value: data.totalUsers, icon: Users, color: 'cobalt' },
    { label: 'Empresas', value: data.totalCompanies, icon: Building2, color: 'cobalt' },
    { label: 'Restaurantes', value: data.totalRestaurants, icon: UtensilsCrossed, color: 'cobalt' },
    { label: 'Pendências', value: data.totalPending, icon: AlertTriangle, color: 'coral', urgent: true },
  ];
  const pending = [
    { label: 'Empresas', value: data.pendingCompanies, section: 'companies' },
    { label: 'Restaurantes', value: data.pendingRestaurants, section: 'restaurants' },
    { label: 'Motoristas', value: data.pendingDrivers, section: 'drivers' },
    { label: 'Jornalistas', value: data.pendingJournalists, section: 'journalists' },
    { label: 'Artigos', value: data.pendingArticles, section: 'articles' },
  ].filter((p) => p.value > 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`glass rounded-2xl p-4 ${s.urgent && s.value > 0 ? 'border border-coral/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-mute font-mono uppercase tracking-wider">{s.label}</span>
              <s.icon size={16} className={s.urgent && s.value > 0 ? 'text-coral' : 'text-mute'} />
            </div>
            <p className={`font-display text-3xl font-bold ${s.urgent && s.value > 0 ? 'text-coral' : 'text-ink'}`}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {pending.length > 0 && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            Aguardando aprovação
          </h3>
          {pending.map((p) => (
            <div key={p.label} className="flex items-center justify-between py-2 border-b border-line last:border-0">
              <span className="text-sm text-ink">{p.label}</span>
              <div className="flex items-center gap-2">
                <span className="chip bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-bold">
                  {p.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empresas ─────────────────────────────────────────────────────────────────

function CompaniesSection() {
  const [items, setItems] = useState<AdminCompany[]>([]);
  const [filter, setFilter] = useState('false');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listCompanies(filter).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = async (id: string, v: boolean) => {
    setActing(id);
    await adminApi.verifyCompany(id, v);
    load();
    setActing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['false', 'Pendentes'], ['true', 'Aprovadas'], ['', 'Todas']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`chip text-sm px-3 py-1.5 ${filter === v ? 'bg-cobalt text-white' : 'bg-ink/5 text-mute'}`}>{l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-ink/5" />)}</div> : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-center text-mute py-8 text-sm">Nenhuma empresa encontrada.</p>}
          {items.map((c) => (
            <div key={c.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar name={c.name} size={10} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/companies/${c.slug}`} target="_blank" className="font-semibold text-sm text-ink hover:text-cobalt transition-colors">{c.name}</Link>
                  <StatusBadge verified={c.isVerified} />
                </div>
                <p className="text-xs text-mute">{c.category} · {c.city} · {c._count.products} produtos · {c._count.orders} pedidos</p>
                <p className="text-xs text-mute">{c.owner.profile?.displayName} · {c.owner.email} · {fmtDate(c.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!c.isVerified && <ActionBtn onClick={() => verify(c.id, true)} approve loading={acting === c.id} />}
                {c.isVerified && <ActionBtn onClick={() => verify(c.id, false)} approve={false} loading={acting === c.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Restaurantes ─────────────────────────────────────────────────────────────

function RestaurantsSection() {
  const [items, setItems] = useState<AdminRestaurant[]>([]);
  const [filter, setFilter] = useState('false');
  const [acting, setActing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listRestaurants(filter).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = async (id: string, v: boolean) => {
    setActing(id);
    await adminApi.verifyRestaurant(id, v);
    load(); setActing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['false', 'Pendentes'], ['true', 'Aprovados'], ['', 'Todos']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`chip text-sm px-3 py-1.5 ${filter === v ? 'bg-cobalt text-white' : 'bg-ink/5 text-mute'}`}>{l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-ink/5" />)}</div> : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-center text-mute py-8 text-sm">Nenhum restaurante encontrado.</p>}
          {items.map((r) => (
            <div key={r.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={18} className="text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-ink">{r.name}</span>
                  <StatusBadge verified={r.isVerified} />
                  {r.isOpen && <span className="chip text-[10px] bg-green-100 text-green-700">Aberto</span>}
                </div>
                <p className="text-xs text-mute">{r.cuisine} · {r.city} · {r._count.menu} itens · {r._count.orders} pedidos</p>
                <p className="text-xs text-mute">{r.owner.profile?.displayName} · {fmtDate(r.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!r.isVerified && <ActionBtn onClick={() => verify(r.id, true)} approve loading={acting === r.id} />}
                {r.isVerified && <ActionBtn onClick={() => verify(r.id, false)} approve={false} loading={acting === r.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Motoristas ───────────────────────────────────────────────────────────────

function DriversSection() {
  const [items, setItems] = useState<AdminDriver[]>([]);
  const [filter, setFilter] = useState('false');
  const [acting, setActing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listDrivers(filter).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const verify = async (id: string, v: boolean) => {
    setActing(id);
    await adminApi.verifyDriver(id, v);
    load(); setActing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['false', 'Pendentes'], ['true', 'Aprovados'], ['', 'Todos']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`chip text-sm px-3 py-1.5 ${filter === v ? 'bg-cobalt text-white' : 'bg-ink/5 text-mute'}`}>{l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-ink/5" />)}</div> : (
        <div className="space-y-2">
          {items.length === 0 && <p className="text-center text-mute py-8 text-sm">Nenhum motorista encontrado.</p>}
          {items.map((d) => (
            <div key={d.id} className="glass rounded-2xl p-3 flex items-center gap-3">
              <Avatar name={d.user.profile?.displayName ?? 'M'} url={d.user.profile?.avatarUrl} size={10} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-ink">{d.user.profile?.displayName}</span>
                  <StatusBadge verified={d.isVerified} />
                </div>
                <p className="text-xs text-mute">{d.user.email} · {d.vehicleType} {d.vehiclePlate} · {d._count.rides} corridas</p>
                <p className="text-xs text-mute">{d.user.profile?.city} · {fmtDate(d.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {!d.isVerified && <ActionBtn onClick={() => verify(d.id, true)} approve loading={acting === d.id} />}
                {d.isVerified && <ActionBtn onClick={() => verify(d.id, false)} approve={false} loading={acting === d.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Jornalistas ──────────────────────────────────────────────────────────────

function JournalistsSection() {
  const [items, setItems] = useState<AdminJournalistApp[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [acting, setActing] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listJournalistApps(filter).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setActing(id);
    await adminApi.reviewJournalistApp(id, status, notes || undefined);
    setNotes(''); load(); setActing(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {[['PENDING', 'Pendentes'], ['APPROVED', 'Aprovados'], ['REJECTED', 'Rejeitados']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`chip text-sm px-3 py-1.5 ${filter === v ? 'bg-cobalt text-white' : 'bg-ink/5 text-mute'}`}>{l}</button>
        ))}
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-ink/5" />)}</div> : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-center text-mute py-8 text-sm">Nenhuma candidatura.</p>}
          {items.map((a) => (
            <div key={a.id} className="glass rounded-2xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Avatar name={a.user.profile?.displayName ?? 'J'} url={a.user.profile?.avatarUrl} size={10} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-ink">{a.user.profile?.displayName}</span>
                    <StatusBadge pending={a.status === 'PENDING'} verified={a.status === 'APPROVED'} />
                  </div>
                  <p className="text-xs text-mute">{a.user.email} · {a.user.profile?.city} · {fmtDate(a.createdAt)}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-sm">
                <p><span className="text-mute text-xs font-mono uppercase">Bio:</span> {a.bio}</p>
                {a.portfolio && <p><span className="text-mute text-xs font-mono uppercase">Portfolio:</span> <a href={a.portfolio} target="_blank" rel="noreferrer" className="text-cobalt hover:underline">{a.portfolio}</a></p>}
                <p><span className="text-mute text-xs font-mono uppercase">Motivação:</span> {a.motivation}</p>
                {a.notes && <p className="text-xs text-mute italic">Nota admin: {a.notes}</p>}
              </div>
              {a.status === 'PENDING' && (
                <div className="flex gap-2 items-center">
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Nota (opcional)" className="flex-1 rounded-xl border border-line bg-surface px-3 py-1.5 text-xs outline-none focus:border-cobalt" />
                  <ActionBtn onClick={() => review(a.id, 'APPROVED')} approve loading={acting === a.id} />
                  <ActionBtn onClick={() => review(a.id, 'REJECTED')} approve={false} loading={acting === a.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Artigos ──────────────────────────────────────────────────────────────────

function ArticlesSection() {
  const [items, setItems] = useState<AdminArticle[]>([]);
  const [acting, setActing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listPendingArticles().then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id: string, status: 'PUBLISHED' | 'REJECTED', featured?: boolean) => {
    setActing(id);
    await adminApi.reviewArticle(id, status, featured);
    load(); setActing(null);
  };

  return (
    <div className="space-y-3">
      {loading ? <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-ink/5" />)}</div> : (
        <>
          {items.length === 0 && <p className="text-center text-mute py-8 text-sm">Nenhum artigo pendente.</p>}
          {items.map((a) => (
            <div key={a.id} className="glass rounded-2xl p-3 flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-magenta/10 flex items-center justify-center shrink-0">
                <FileText size={16} className="text-magenta" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/news/article/${a.slug}`} target="_blank" className="font-semibold text-sm text-ink hover:text-magenta transition-colors line-clamp-1">{a.title}</Link>
                  {a.category && <span className="chip text-[10px]" style={{ background: `${a.category.color}20`, color: a.category.color }}>{a.category.name}</span>}
                </div>
                <p className="text-xs text-mute">{a.author.profile?.displayName} · {fmtDate(a.createdAt)}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => review(a.id, 'PUBLISHED', true)} disabled={acting === a.id} title="Publicar em destaque" className="flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50">
                  <Star size={11} />
                </button>
                <ActionBtn onClick={() => review(a.id, 'PUBLISHED')} approve loading={acting === a.id} />
                <ActionBtn onClick={() => review(a.id, 'REJECTED')} approve={false} loading={acting === a.id} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ─── Usuários ─────────────────────────────────────────────────────────────────

const ROLES = ['USER', 'BUSINESS_OWNER', 'JOURNALIST', 'DRIVER', 'RESTAURANT_OWNER', 'ADMIN'];

function UsersSection() {
  const [items, setItems] = useState<AdminUser[]>([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.listUsers(search || undefined).then((r) => setItems(r.data)).finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (id: string, role: string) => {
    await adminApi.updateRole(id, role);
    load();
  };

  const toggle = async (id: string) => {
    await adminApi.toggleActive(id);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mute" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setSearch(q)} placeholder="Buscar por email ou nome..." className="w-full rounded-xl border border-line bg-surface pl-8 pr-3 py-2 text-sm outline-none focus:border-cobalt" />
        </div>
        <button onClick={() => { setSearch(q); }} className="chip bg-cobalt text-white px-3 py-2 text-sm"><Search size={13} /></button>
      </div>
      {loading ? <div className="animate-pulse space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 rounded-2xl bg-ink/5" />)}</div> : (
        <div className="space-y-1.5">
          {items.map((u) => (
            <div key={u.id} className="glass rounded-xl p-3 flex items-center gap-3">
              <Avatar name={u.profile?.displayName ?? u.email} url={u.profile?.avatarUrl} size={9} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink truncate">{u.profile?.displayName ?? '—'}</p>
                <p className="text-xs text-mute truncate">{u.email}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)} className="rounded-lg border border-line bg-surface px-2 py-1 text-xs outline-none">
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button onClick={() => toggle(u.id)} title={u.isActive ? 'Desativar' : 'Ativar'} className="text-mute hover:text-cobalt transition-colors">
                  {u.isActive ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Créditos ─────────────────────────────────────────────────────────────────

function CreditsSection() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { adminApi.getCreditPlans().then((r) => setData(r.data)); }, []);

  if (!data) return <div className="animate-pulse h-40 rounded-2xl bg-ink/5" />;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4 border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10">
        <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
          <AlertTriangle size={14} />
          {data.message}
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-ink mb-3">Pacotes de Créditos</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {data.plans?.map((p: any) => (
            <div key={p.id} className="glass rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-ink">{p.name}</span>
                <span className="chip bg-cobalt/10 text-cobalt text-xs">{p.credits} créditos</span>
              </div>
              <p className="text-sm text-mute">{p.description}</p>
              <p className="font-display text-xl font-bold text-cobalt">R$ {p.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-sm text-ink mb-3">Assinaturas</h3>
        <div className="space-y-2">
          {data.subscriptions?.map((s: any) => (
            <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-sm text-ink">{s.name}</p>
                <p className="text-xs text-mute">{s.description}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-cobalt">R$ {s.price.toFixed(2)}</p>
                <p className="text-xs text-mute">/{s.period === 'month' ? 'mês' : s.period}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────

export function AdminPanel() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const [section, setSection] = useState('dashboard');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);

  useEffect(() => {
    if (user?.role !== 'ADMIN') { navigate('/feed'); return; }
    adminApi.getDashboard().then((r) => setDashboard(r.data)).catch(() => {});
  }, [user, navigate]);

  if (user?.role !== 'ADMIN') return null;

  const pendingBadge = (key: keyof AdminDashboard) => {
    const v = dashboard?.[key] as number | undefined;
    if (!v || v === 0) return null;
    return <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-coral text-white text-[10px] font-bold px-1">{v}</span>;
  };

  const sectionBadges: Record<string, keyof AdminDashboard> = {
    companies: 'pendingCompanies',
    restaurants: 'pendingRestaurants',
    drivers: 'pendingDrivers',
    journalists: 'pendingJournalists',
    articles: 'pendingArticles',
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-line bg-surface p-4 gap-1 shrink-0">
        <div className="px-2 pb-4 mb-2 border-b border-line">
          <p className="font-display text-base font-bold text-ink">Admin</p>
          <p className="text-xs text-mute truncate">{user.email}</p>
        </div>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors text-left ${
              section === s.id ? 'bg-cobalt text-white' : 'text-mute hover:bg-ink/5 hover:text-ink'
            }`}
          >
            <s.icon size={16} />
            {s.label}
            {pendingBadge(sectionBadges[s.id] as keyof AdminDashboard)}
          </button>
        ))}
        <div className="mt-auto pt-4 border-t border-line">
          <Link to="/feed" className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-mute hover:text-ink transition-colors">
            <ChevronRight size={16} />
            Voltar ao app
          </Link>
          <button onClick={() => { logout(); navigate('/login'); }} className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-coral hover:bg-coral/5 transition-colors">
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line flex overflow-x-auto">
        {sections.slice(0, 6).map((s) => (
          <button key={s.id} onClick={() => setSection(s.id)} className={`flex flex-col items-center gap-0.5 px-3 py-2 shrink-0 text-[10px] ${section === s.id ? 'text-cobalt' : 'text-mute'}`}>
            <s.icon size={18} />
            {s.label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Main */}
      <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-xl font-bold text-ink">
              {sections.find((s) => s.id === section)?.label}
            </h1>
            <button onClick={() => adminApi.getDashboard().then((r) => setDashboard(r.data))} className="text-mute hover:text-ink transition-colors">
              <RefreshCw size={16} />
            </button>
          </div>

          {section === 'dashboard' && <DashboardSection data={dashboard} />}
          {section === 'companies' && <CompaniesSection />}
          {section === 'restaurants' && <RestaurantsSection />}
          {section === 'drivers' && <DriversSection />}
          {section === 'journalists' && <JournalistsSection />}
          {section === 'articles' && <ArticlesSection />}
          {section === 'users' && <UsersSection />}
          {section === 'credits' && <CreditsSection />}
        </div>
      </main>
    </div>
  );
}
