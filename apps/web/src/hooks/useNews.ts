import { useState, useEffect, useCallback } from 'react';
import { newsApi, type Article, type NewsCategory } from '../services/newsApi';

export function useNewsPortal(categoryId?: string, q?: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [artRes, catRes] = await Promise.all([
        newsApi.listPublic({ categoryId, q }),
        newsApi.getCategories(),
      ]);
      setArticles(Array.isArray(artRes.data) ? artRes.data : (artRes.data as any).articles ?? []);
      setCategories(catRes.data);
    } catch {
      setError('Erro ao carregar notícias');
    } finally {
      setLoading(false);
    }
  }, [categoryId, q]);

  useEffect(() => { load(); }, [load]);

  return { articles, categories, loading, error, reload: load };
}

export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    newsApi.getArticle(slug)
      .then((r) => setArticle(r.data))
      .catch(() => setError('Artigo não encontrado'))
      .finally(() => setLoading(false));
  }, [slug]);

  return { article, loading, error };
}

export function useMyArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await newsApi.listMyArticles();
      setArticles(r.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return { articles, loading, reload: load };
}
