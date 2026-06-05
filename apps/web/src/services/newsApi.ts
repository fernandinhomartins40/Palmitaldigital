import { api } from './api';

export interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

export interface ArticleAuthor {
  id: string;
  profile: { displayName: string; avatarUrl?: string | null };
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverUrl?: string | null;
  content: string;
  status: string;
  publishedAt?: string | null;
  createdAt: string;
  author: ArticleAuthor;
  category?: NewsCategory | null;
  tags: string[];
  _count?: { comments: number };
}

export interface ArticleComment {
  id: string;
  content: string;
  createdAt: string;
  author: ArticleAuthor;
}

export interface JournalistApplication {
  id: string;
  bio: string;
  portfolio: string;
  motivation: string;
  status: string;
  createdAt: string;
}

export const newsApi = {
  listPublic: (params?: { categoryId?: string; q?: string; page?: number; limit?: number }) =>
    api.get<Article[]>('/news', { params }),

  listFeedArticles: (limit = 6) =>
    api.get<Article[]>('/news', { params: { limit } }),

  listByAuthor: (authorId: string) =>
    api.get<Article[]>('/news', { params: { authorId } }),

  getCategories: () =>
    api.get<NewsCategory[]>('/news/categories'),

  getArticle: (slug: string) =>
    api.get<Article>(`/news/${slug}`),

  createArticle: (data: {
    title: string;
    content: string;
    excerpt: string;
    categoryId?: string;
    tags?: string[];
    coverUrl?: string;
  }) => api.post<Article>('/news/articles', data),

  updateArticle: (id: string, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    categoryId: string;
    tags: string[];
    coverUrl: string;
  }>) => api.patch<Article>(`/news/articles/${id}`, data),

  submitArticle: (id: string) =>
    api.post<Article>(`/news/articles/${id}/submit`),

  listMyArticles: () =>
    api.get<Article[]>('/news/articles/mine'),

  getComments: (articleId: string) =>
    api.get<ArticleComment[]>(`/news/articles/${articleId}/comments`),

  addComment: (articleId: string, content: string) =>
    api.post<ArticleComment>(`/news/articles/${articleId}/comments`, { content }),

  deleteComment: (commentId: string) =>
    api.delete(`/news/comments/${commentId}`),

  applyJournalist: (data: { bio: string; portfolio: string; motivation: string }) =>
    api.post<JournalistApplication>('/news/journalist/apply', data),

  getMyApplication: () =>
    api.get<JournalistApplication>('/news/journalist/application'),

  adminListApplications: () =>
    api.get<JournalistApplication[]>('/news/journalist/applications'),

  adminReviewApplication: (id: string, status: 'APPROVED' | 'REJECTED') =>
    api.patch(`/news/journalist/applications/${id}`, { status }),

  adminListPending: () =>
    api.get<Article[]>('/news/articles/pending'),

  adminReviewArticle: (id: string, status: 'PUBLISHED' | 'REJECTED') =>
    api.patch(`/news/articles/${id}/review`, { status }),

  createCategory: (data: { name: string; slug: string; color: string }) =>
    api.post<NewsCategory>('/news/categories', data),
};
