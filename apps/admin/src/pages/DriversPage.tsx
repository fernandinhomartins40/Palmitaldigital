import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Car } from 'lucide-react';
import { adminApi } from '../api';

export function DriversPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);

  const load = (f = filter) => {
    setLoading(true);
    adminApi.listDrivers(f).then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const verify = async (id: string, verified: boolean) => {
    await adminApi.verifyDriver(id, verified);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Motoristas</h1>
          <p className="mt-1 text-sm text-gray-500">Aprovação promove automaticamente para role DRIVER</p>
        </div>
        <div className="flex gap-2">
          {['pending', 'verified', 'all'].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`btn ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
            >
              {v === 'pending' ? 'Pendentes' : v === 'verified' ? 'Aprovados' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Nenhum motorista encontrado.</div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="card flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600 shrink-0">
                <Car size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate">{d.user?.name ?? d.user?.email}</p>
                <p className="text-xs text-gray-400 truncate">{d.user?.email}</p>
              </div>
              <span className={`badge ${d.verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {d.verified ? 'Aprovado' : 'Pendente'}
              </span>
              <div className="flex gap-2">
                {!d.verified && (
                  <button onClick={() => verify(d.id, true)} className="btn-success text-xs px-3 py-1.5">
                    <CheckCircle size={14} /> Aprovar
                  </button>
                )}
                {d.verified && (
                  <button onClick={() => verify(d.id, false)} className="btn-danger text-xs px-3 py-1.5">
                    <XCircle size={14} /> Revogar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
