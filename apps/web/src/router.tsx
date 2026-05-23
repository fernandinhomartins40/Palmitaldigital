import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spinner } from '@palmital/ui';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { PwaLoginPage } from './pages/pwa/PwaLoginPage';
import { PwaSplashPage } from './pages/pwa/PwaSplashPage';
import { shouldUsePwaShell } from './utils/pwa';

const FeedPage = lazy(() => import('./pages/feed/FeedPage').then((m) => ({ default: m.FeedPage })));
const ClassifiedsPage = lazy(() => import('./pages/classifieds/ClassifiedsPage').then((m) => ({ default: m.ClassifiedsPage })));
const ClassifiedDetailPage = lazy(() => import('./pages/classifieds/ClassifiedDetailPage').then((m) => ({ default: m.ClassifiedDetailPage })));
const CompaniesPage = lazy(() => import('./pages/companies/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyProfilePage = lazy(() => import('./pages/companies/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage })));
const CompanyManagerPage = lazy(() => import('./pages/companies/CompanyManagerPage').then((m) => ({ default: m.CompanyManagerPage })));
const ConversationsPage = lazy(() => import('./pages/chat/ConversationsPage').then((m) => ({ default: m.ConversationsPage })));
const ChatPage = lazy(() => import('./pages/chat/ChatPage').then((m) => ({ default: m.ChatPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then((m) => ({ default: m.UserProfilePage })));
const CreatePostPage = lazy(() => import('./pages/create/CreatePostPage').then((m) => ({ default: m.CreatePostPage })));

const Loader = () => (
  <div className="flex h-screen items-center justify-center">
    <Spinner size="lg" />
  </div>
);

function Page({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (shouldUsePwaShell(pathname)) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  { path: '/', element: <PublicRoute><LandingPage /></PublicRoute> },
  { path: '/landing', element: <Navigate to="/" replace /> },
  { path: '/login', element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: '/register', element: <PublicRoute><RegisterPage /></PublicRoute> },
  { path: '/app', element: <PwaSplashPage /> },
  { path: '/app/login', element: <PwaLoginPage /> },
  {
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { path: '/feed', element: <Page><FeedPage /></Page> },
      { path: '/classifieds', element: <Page><ClassifiedsPage /></Page> },
      { path: '/classifieds/:id', element: <Page><ClassifiedDetailPage /></Page> },
      { path: '/companies', element: <Page><CompaniesPage /></Page> },
      { path: '/companies/manage', element: <Page><CompanyManagerPage /></Page> },
      { path: '/companies/:slug', element: <Page><CompanyProfilePage /></Page> },
      { path: '/chat', element: <Page><ConversationsPage /></Page> },
      { path: '/chat/:conversationId', element: <Page><ChatPage /></Page> },
      { path: '/profile', element: <Page><ProfilePage /></Page> },
      { path: '/profile/:id', element: <Page><UserProfilePage /></Page> },
      { path: '/create', element: <Page><CreatePostPage /></Page> },
    ],
  },
]);
