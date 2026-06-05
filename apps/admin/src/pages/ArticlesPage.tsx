import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Star, FileText } from 'lucide-react';
import { adminApi } from '../api';

export function ArticlesPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    adminApi.listPendingArticles().then((r) => setItems(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: string, isFeatured = false) => {
    await adminApi.reviewArticle(id, status, isFeatured);
    load();
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Artigos pendentes</h1>
        <p className="mt-1 text-sm text-gray-500">Publique, destaque ou rejeite artigos submetidos</p>
      </div>

      {loading ? (
        <p className="text-gray-400">Carregando…</p>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-gray-400">Nenhum artigo pendente.</div>
      ) : (
        <div className="space-y-4">
          {items.map((a) => (
            <div key={a.id} className="card p-5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 text-sky-600 shrink-0">
                  <FileText size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-snug">{a.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">por {a.author?.name ?? a.author?.email}</p>
                  {a.summary && <p className="mt-2 text-sm text-gray-600 line-clamp-3">{a.summary}</p>}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap pt-1">
                <button onClick={() => review(a.id, 'PUBLISHED')} className="btn-success text-xs px-3">
                  <CheckCircle size={14} /> Publicar
                </button>
                <button onClick={() => review(a.id, 'PUBLISHED', true)} className="btn text-xs px-3 bg-yellow-400 text-white hover:bg-yellow-500">
                  <Star size={14} /> Publicar em destaque
                </button>
                <button onClick={() => review(a.id, 'REJECTED')} className="btn-danger text-xs px-3">
                  <XCircle size={14} /> Rejeitar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
