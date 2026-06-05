import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Clock, MessageCircle, Share2, Send, Trash2, Newspaper } from 'lucide-react';
import { useArticle } from '../../hooks/useNews';
import { newsApi, type Article, type ArticleComment } from '../../services/newsApi';
import { useAuthStore } from '../../store/authStore';

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatShort(d: string) {
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Sugestões ────────────────────────────────────────────────────────────────

function SuggestionCard({ article }: { article: Article }) {
  return (
    <Link
      to={`/news/article/${article.slug}`}
      className="group flex gap-3 rounded-2xl border border-line p-3 hover:bg-ink/[0.02] dark:hover:bg-white/[0.03] transition-colors"
    >
      {article.coverUrl ? (
        <img
          src={article.coverUrl}
          alt=""
          className="h-16 w-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-xl bg-magenta/10">
          <Newspaper size={18} className="text-magenta/40" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        {article.category && (
          <span
            className="chip text-[10px] mb-1 inline-block"
            style={{ background: `${article.category.color}20`, color: article.category.color }}
          >
            {article.category.name}
          </span>
        )}
        <h4 className="text-sm font-semibold text-ink leading-snug line-clamp-2 group-hover:text-magenta transition-colors">
          {article.title}
        </h4>
        <p className="text-[11px] text-mute mt-1 flex items-center gap-1">
          <Clock size={10} />
          {formatShort(article.publishedAt ?? article.createdAt)}
          <span className="mx-1">·</span>
          {article.author.profile.displayName}
        </p>
      </div>
    </Link>
  );
}

function RelatedArticles({ current }: { current: Article }) {
  const [suggestions, setSuggestions] = useState<Article[]>([]);

  useEffect(() => {
    // Buscar por categoria + por autor, mesclar e deduplicar
    const reqs: Promise<Article[]>[] = [
      newsApi.listPublic({ limit: 8 }).then((r) => r.data),
    ];
    if (current.category) {
      reqs.push(newsApi.listPublic({ categoryId: current.category.id, limit: 6 }).then((r) => r.data));
    }
    reqs.push(newsApi.listByAuthor(current.author.id).then((r) => r.data));

    Promise.all(reqs).then((results) => {
      const seen = new Set<string>([current.id]);
      const merged: Article[] = [];
      // Prioridade: mesma categoria + mesmo autor
      const byCat = results[1] ?? [];
      const byAuthor = results[results.length - 1] ?? [];
      const byRecent = results[0] ?? [];

      for (const a of [...byCat, ...byAuthor, ...byRecent]) {
        if (!seen.has(a.id) && merged.length < 6) {
          seen.add(a.id);
          merged.push(a);
        }
      }
      setSuggestions(merged);
    });
  }, [current.id, current.category?.id, current.author.id]);

  if (suggestions.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="font-semibold text-sm text-ink flex items-center gap-2">
        <Newspaper size={15} className="text-magenta" />
        Leia também
      </h3>
      <div className="space-y-2">
        {suggestions.map((a) => (
          <SuggestionCard key={a.id} article={a} />
        ))}
      </div>
      <Link
        to="/news"
        className="block text-center text-sm text-magenta hover:underline pt-1"
      >
        Ver todas as notícias →
      </Link>
    </section>
  );
}

// ─── Comentários ──────────────────────────────────────────────────────────────

function CommentSection({ articleId }: { articleId: string }) {
  const [comments, setComments] = useState<ArticleComment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    newsApi.getComments(articleId).then((r) => setComments(r.data));
  }, [articleId]);

  const submit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const r = await newsApi.addComment(articleId, text.trim());
      setComments((p) => [...p, r.data]);
      setText('');
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    await newsApi.deleteComment(id);
    setComments((p) => p.filter((c) => c.id !== id));
  };

  return (
    <section className="space-y-4">
      <h3 className="font-semibold text-ink flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-magenta" />
        Comentários ({comments.length})
      </h3>

      {user && (
        <div className="flex gap-2">
          <input
            className="flex-1 glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50"
            placeholder="Deixe seu comentário..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && submit()}
          />
          <button
            onClick={submit}
            disabled={loading || !text.trim()}
            className="btn-ink px-4 py-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="glass rounded-2xl p-3 flex gap-3">
            <div className="w-8 h-8 rounded-full bg-magenta/20 flex items-center justify-center text-xs font-bold text-magenta flex-shrink-0">
              {c.author.profile.displayName[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-ink">{c.author.profile.displayName}</span>
                <span className="text-xs text-mute">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-ink/90">{c.content}</p>
            </div>
            {(user?.id === c.author.id || user?.role === 'ADMIN') && (
              <button
                onClick={() => remove(c.id)}
                className="text-mute hover:text-coral transition-colors flex-shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Página do artigo ─────────────────────────────────────────────────────────

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const { article, loading, error } = useArticle(slug!);

  const share = () => {
    if (navigator.share) {
      navigator.share({ title: article?.title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 animate-pulse">
        <div className="h-8 glass rounded-2xl w-2/3" />
        <div className="h-64 glass rounded-3xl" />
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-4 glass rounded-xl" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-12 text-center">
          <p className="text-4xl mb-3">😕</p>
          <p className="font-semibold text-ink">Artigo não encontrado</p>
          <Link to="/news" className="btn-ink mt-4 inline-flex">Voltar ao portal</Link>
        </div>
      </div>
    );
  }

  return (
    <article className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Back */}
      <Link to="/news" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Portal de notícias
      </Link>

      {/* Cover */}
      {article.coverUrl && (
        <div className="rounded-3xl overflow-hidden h-64 md:h-80">
          <img src={article.coverUrl} alt={article.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Meta */}
      <div className="space-y-3">
        {article.category && (
          <span
            className="chip text-xs"
            style={{ background: `${article.category.color}20`, color: article.category.color }}
          >
            {article.category.name}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-bold text-ink leading-tight">{article.title}</h1>
        {article.excerpt && (
          <p className="text-mute text-base leading-relaxed">{article.excerpt}</p>
        )}

        <div className="flex items-center justify-between">
          <Link to={`/news/portal/${article.author.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-full bg-magenta/20 flex items-center justify-center text-sm font-bold text-magenta">
              {article.author.profile.displayName[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-ink hover:text-magenta transition-colors">{article.author.profile.displayName}</p>
              <p className="text-xs text-mute flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(article.publishedAt || article.createdAt)}
              </p>
            </div>
          </Link>
          <button onClick={share} className="btn-glass flex items-center gap-2 text-sm">
            <Share2 className="w-4 h-4" />
            Compartilhar
          </button>
        </div>
      </div>

      <div className="border-t border-line" />

      {/* Content */}
      <div className="prose prose-sm max-w-none text-ink/90 [&_h1]:text-ink [&_h2]:text-ink [&_h3]:text-ink [&_a]:text-magenta [&_blockquote]:border-l-magenta [&_blockquote]:bg-magenta/5 [&_blockquote]:rounded-r-xl [&_blockquote]:py-1 [&_code]:bg-subtle [&_code]:rounded [&_pre]:glass [&_pre]:rounded-2xl">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.content}</ReactMarkdown>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="chip text-xs bg-subtle text-mute">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="border-t border-line" />

      {/* Sugestões de leitura */}
      <RelatedArticles current={article} />

      <div className="border-t border-line" />

      {/* Comentários */}
      <CommentSection articleId={article.id} />
    </article>
  );
}
