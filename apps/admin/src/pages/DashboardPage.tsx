import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, UtensilsCrossed, Car, Newspaper, FileText, AlertCircle } from 'lucide-react';
import { adminApi, type Dashboard } from '../api';

const pendingCards = [
  { key: 'pendingCompanies',   label: 'Empresas pendentes',    icon: Building2,       to: '/companies' },
  { key: 'pendingRestaurants', label: 'Restaurantes pendentes',icon: UtensilsCrossed, to: '/restaurants' },
  { key: 'pendingDrivers',     label: 'Motoristas pendentes',  icon: Car,             to: '/drivers' },
  { key: 'pendingJournalists', label: 'Jornalistas pendentes', icon: Newspaper,       to: '/journalists' },
  { key: 'pendingArticles',    label: 'Artigos pendentes',     icon: FileText,        to: '/articles' },
] as const;

export function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Carregando…</div>;
  if (!data) return <div className="p-8 text-red-500">Erro ao carregar dashboard.</div>;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Visão geral do sistema</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Usuários',     value: data.totalUsers },
          { label: 'Empresas',     value: data.totalCompanies },
          { label: 'Restaurantes', value: data.totalRestaurants },
          { label: 'Pendências',   value: data.totalPending },
        ].map(({ label, value }) => (
          <div key={label} className="card p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending actions */}
      {data.totalPending > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-800">
            <AlertCircle size={18} className="text-amber-500" />
            Ações pendentes
          </h2>
          <div className="space-y-2">
            {pendingCards
              .filter(({ key }) => data[key] > 0)
              .map(({ key, label, icon: Icon, to }) => (
                <Link
                  key={key}
                  to={to}
                  className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className="text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">{label}</span>
                  </div>
                  <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {data[key]}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {data.totalPending === 0 && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-6 py-5 text-center">
          <p className="text-sm font-medium text-green-700">Tudo em dia! Nenhuma pendência no momento.</p>
        </div>
      )}
    </div>
  );
}
