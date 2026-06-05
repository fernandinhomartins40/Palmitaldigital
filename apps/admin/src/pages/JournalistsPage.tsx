import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Newspaper } from 'lucide-react';
import { adminApi } from '../api';

export function JournalistsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = (f = filter) => {
    setLoading(true);
    adminApi.listJournalistApps(f).then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const review = async (id: string, status: string) => {
    await adminApi.reviewJournalistApp(id, status, notes[id]);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jornalistas</h1>
          <p className="mt-1 text-sm text-gray-500">Analise candidaturas para jornalista</p>
        </div>
        <div className="flex gap-2">
          {['PENDING', 'APPROVED', 'REJECTED'].map((v) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`btn ${filter === v ? 'btn-primary' : 'btn-ghost'}`}
            >
              {v === 'PENDING' ? 'Pendentes' : v === 'APPROVED' ? 'Aprovados' : 'Rejeitados'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Nenhuma candidatura encontrada.</div>
      ) : (
        <div className="space-y-4">
          {items.map((j) => (
            <div key={j.id} className="card p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 shrink-0">
                  <Newspaper size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{j.user?.name ?? j.user?.email}</p>
                  <p className="text-xs text-gray-400">{j.user?.email}</p>
                  {j.bio && <p className="mt-2 text-sm text-gray-600">{j.bio}</p>}
                  {j.portfolio && (
                    <a href={j.portfolio} target="_blank" rel="noreferrer" className="mt-1 text-xs text-blue-600 hover:underline">
                      {j.portfolio}
                    </a>
                  )}
                </div>
                <span className={`badge shrink-0 ${
                  j.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                  j.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {j.status === 'APPROVED' ? 'Aprovado' : j.status === 'REJECTED' ? 'Rejeitado' : 'Pendente'}
                </span>
              </div>

              {j.status === 'PENDING' && (
                <div className="flex gap-3 pt-1">
                  <input
                    className="input flex-1 text-sm"
                    placeholder="Nota interna (opcional)"
                    value={notes[j.id] ?? ''}
                    onChange={(e) => setNotes((n) => ({ ...n, [j.id]: e.target.value }))}
                  />
                  <button onClick={() => review(j.id, 'APPROVED')} className="btn-success text-xs px-3">
                    <CheckCircle size={14} /> Aprovar
                  </button>
                  <button onClick={() => review(j.id, 'REJECTED')} className="btn-danger text-xs px-3">
                    <XCircle size={14} /> Rejeitar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
