import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spinner } from '@palmital/ui';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';

const FeedPage = lazy(() => import('./pages/feed/FeedPage').then((m) => ({ default: m.FeedPage })));
const ClassifiedsPage = lazy(() => import('./pages/classifieds/ClassifiedsPage').then((m) => ({ default: m.ClassifiedsPage })));
const ClassifiedDetailPage = lazy(() => import('./pages/classifieds/ClassifiedDetailPage').then((m) => ({ default: m.ClassifiedDetailPage })));
const CompaniesPage = lazy(() => import('./pages/companies/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyProfilePage = lazy(() => import('./pages/companies/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage })));
const ConversationsPage = lazy(() => import('./pages/chat/ConversationsPage').then((m) => ({ default: m.ConversationsPage })));
const ChatPage = lazy(() => import('./pages/chat/ChatPage').then((m) => ({ default: m.ChatPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const CreatePostPage = lazy(() => import('./pages/create/CreatePostPage').then((m) => ({ default: m.CreatePostPage })));

const Loader = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      {
        index: true,
        element: <Suspense fallback={<Loader />}><FeedPage /></Suspense>,
      },
      {
        path: '/classifieds',
        element: <Suspense fallback={<Loader />}><ClassifiedsPage /></Suspense>,
      },
      {
        path: '/classifieds/:id',
        element: <Suspense fallback={<Loader />}><ClassifiedDetailPage /></Suspense>,
      },
      {
        path: '/companies',
        element: <Suspense fallback={<Loader />}><CompaniesPage /></Suspense>,
      },
      {
        path: '/companies/:slug',
        element: <Suspense fallback={<Loader />}><CompanyProfilePage /></Suspense>,
      },
      {
        path: '/chat',
        element: <Suspense fallback={<Loader />}><ConversationsPage /></Suspense>,
      },
      {
        path: '/chat/:conversationId',
        element: <Suspense fallback={<Loader />}><ChatPage /></Suspense>,
      },
      {
        path: '/profile',
        element: <Suspense fallback={<Loader />}><ProfilePage /></Suspense>,
      },
      {
        path: '/create',
        element: <Suspense fallback={<Loader />}><CreatePostPage /></Suspense>,
      },
    ],
  },
]);
