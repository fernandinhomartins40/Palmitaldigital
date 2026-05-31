import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, Eye, EyeOff, Save, Send, FileText, Clock } from 'lucide-react';
import { newsApi, type NewsCategory, type Article } from '../../services/newsApi';
import { useAuthStore } from '../../store/authStore';
import { useMyArticles } from '../../hooks/useNews';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'var(--mute)' },
  PENDING_REVIEW: { label: 'Em revisão', color: 'var(--amber)' },
  PUBLISHED: { label: 'Publicado', color: 'var(--mint)' },
  REJECTED: { label: 'Rejeitado', color: 'var(--coral)' },
};

function ArticleStatusChip({ status }: { status: string }) {
  const s = STATUS_LABEL[status] ?? { label: status, color: 'var(--mute)' };
  return (
    <span
      className="chip text-xs"
      style={{ background: `color-mix(in srgb, ${s.color} 15%, transparent)`, color: s.color }}
    >
      {s.label}
    </span>
  );
}

export function WriteArticlePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isJournalist = user?.role === 'JOURNALIST' || user?.role === 'ADMIN';

  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'write' | 'list'>('write');

  const { articles, loading: loadingArticles, reload } = useMyArticles();

  useEffect(() => {
    newsApi.getCategories().then((r) => setCategories(r.data));
  }, []);

  if (!isJournalist) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="glass rounded-3xl p-8 text-center space-y-4">
          <p className="text-4xl">🔒</p>
          <p className="font-semibold text-ink">Acesso restrito</p>
          <p className="text-mute text-sm">Apenas jornalistas credenciados podem escrever artigos.</p>
          <Link to="/news/apply" className="btn-ink inline-flex">Solicitar credenciamento</Link>
        </div>
      </div>
    );
  }

  const save = async (submit = false) => {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        categoryId: categoryId || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
      };
      let article: Article;
      if (currentId) {
        article = (await newsApi.updateArticle(currentId, payload)).data;
      } else {
        article = (await newsApi.createArticle(payload)).data;
        setCurrentId(article.id);
      }
      if (submit) {
        await newsApi.submitArticle(article.id);
        navigate('/news');
      }
      reload();
    } finally {
      setSaving(false);
    }
  };

  const loadArticle = (a: Article) => {
    setCurrentId(a.id);
    setTitle(a.title);
    setExcerpt(a.excerpt || '');
    setContent(a.content);
    setCategoryId(a.category?.id || '');
    setTags(a.tags.join(', '));
    setActiveTab('write');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/news" className="flex items-center gap-2 text-sm text-mute hover:text-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Portal de notícias
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`btn-glass flex items-center gap-1.5 text-sm ${activeTab === 'list' ? 'ring-1 ring-magenta/40' : ''}`}
          >
            <FileText className="w-4 h-4" />
            Meus artigos
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`btn-glass flex items-center gap-1.5 text-sm ${activeTab === 'write' ? 'ring-1 ring-magenta/40' : ''}`}
          >
            Novo artigo
          </button>
        </div>
      </div>

      {/* My Articles list */}
      {activeTab === 'list' && (
        <div className="space-y-3">
          <h2 className="font-semibold text-ink">Meus artigos</h2>
          {loadingArticles && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="glass rounded-2xl h-16 animate-pulse" />
              ))}
            </div>
          )}
          {!loadingArticles && articles.length === 0 && (
            <div className="glass rounded-3xl p-8 text-center">
              <p className="text-mute text-sm">Nenhum artigo ainda</p>
            </div>
          )}
          {articles.map((a) => (
            <button
              key={a.id}
              onClick={() => loadArticle(a)}
              className="glass rounded-2xl p-4 w-full text-left flex items-center gap-3 hover:shadow transition-all"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm truncate">{a.title}</p>
                <p className="text-xs text-mute flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <ArticleStatusChip status={a.status} />
            </button>
          ))}
        </div>
      )}

      {/* Editor */}
      {activeTab === 'write' && (
        <div className="space-y-4">
          <div className="halo halo-magenta glass rounded-3xl p-5 space-y-4">
            <h2 className="font-semibold text-ink">
              {currentId ? 'Editar artigo' : 'Novo artigo'}
            </h2>

            <input
              className="w-full glass-strong rounded-2xl px-4 py-3 text-base font-semibold text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50"
              placeholder="Título do artigo..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <input
              className="w-full glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50"
              placeholder="Resumo / excerpt (aparece na listagem)..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />

            <div className="flex gap-2">
              <select
                className="flex-1 glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink outline-none border border-line focus:border-magenta/50 bg-transparent"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <input
                className="flex-1 glass-strong rounded-2xl px-4 py-2.5 text-sm text-ink placeholder:text-mute outline-none border border-line focus:border-magenta/50"
                placeholder="Tags: política, cidade..."
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>
          </div>

          {/* Editor / Preview toggle */}
          <div className="glass rounded-3xl overflow-hidden">
            <div className="flex border-b border-line">
              <button
                onClick={() => setPreview(false)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  !preview ? 'text-magenta' : 'text-mute hover:text-ink'
                }`}
              >
                Editar
              </button>
              <button
                onClick={() => setPreview(true)}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  preview ? 'text-magenta' : 'text-mute hover:text-ink'
                }`}
              >
                {preview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                Preview
              </button>
            </div>

            {!preview ? (
              <textarea
                className="w-full p-5 text-sm text-ink placeholder:text-mute outline-none bg-transparent font-mono resize-none"
                rows={20}
                placeholder={`Escreva seu artigo em Markdown...\n\n## Subtítulo\n\n**negrito**, *itálico*, [link](url)\n\n> Citação importante\n\n- Lista de itens`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            ) : (
              <div className="p-5 prose prose-sm max-w-none text-ink/90 min-h-[400px] [&_a]:text-magenta [&_blockquote]:border-l-magenta [&_blockquote]:bg-magenta/5 [&_code]:bg-subtle [&_pre]:glass [&_pre]:rounded-2xl">
                {content ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
                ) : (
                  <p className="text-mute italic">O preview aparece aqui...</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => save(false)}
              disabled={saving || !title.trim()}
              className="btn-glass flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Salvando...' : 'Salvar rascunho'}
            </button>
            <button
              onClick={() => save(true)}
              disabled={saving || !title.trim() || !content.trim()}
              className="btn-ink flex items-center gap-2 text-sm flex-1 justify-center disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Enviar para revisão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
