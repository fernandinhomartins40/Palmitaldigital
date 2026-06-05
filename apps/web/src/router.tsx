import { Navigate, createBrowserRouter, useLocation } from 'react-router-dom';
import { Suspense } from 'react';
import { Spinner } from '@palmital/ui';
import { AppLayout } from './components/layout/AppLayout';
import { AuthGuard } from './components/layout/AuthGuard';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { lazyWithRetry as lazy } from './utils/lazyWithRetry';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { LandingPage } from './pages/LandingPage';
import { PwaLoginPage } from './pages/pwa/PwaLoginPage';
import { PwaSplashPage } from './pages/pwa/PwaSplashPage';
import { shouldUsePwaShell } from './utils/pwa';

const FeedPage = lazy(() => import('./pages/feed/FeedPage').then((m) => ({ default: m.FeedPage })));
const ClassifiedsPage = lazy(() => import('./pages/classifieds/ClassifiedsPage').then((m) => ({ default: m.ClassifiedsPage })));
const ClassifiedDetailPage = lazy(() => import('./pages/classifieds/ClassifiedDetailPage').then((m) => ({ default: m.ClassifiedDetailPage })));
const MyClassifiedsPage = lazy(() => import('./pages/classifieds/MyClassifiedsPage').then((m) => ({ default: m.MyClassifiedsPage })));
const CompaniesPage = lazy(() => import('./pages/companies/CompaniesPage').then((m) => ({ default: m.CompaniesPage })));
const CompanyProfilePage = lazy(() => import('./pages/companies/CompanyProfilePage').then((m) => ({ default: m.CompanyProfilePage })));
const CompanyManagerPage = lazy(() => import('./pages/companies/CompanyManagerPage').then((m) => ({ default: m.CompanyManagerPage })));
const CompanyOrderTrackPage = lazy(() => import('./pages/companies/CompanyOrderTrackPage').then((m) => ({ default: m.CompanyOrderTrackPage })));
const CompanyOrdersPage = lazy(() => import('./pages/companies/CompanyOrdersPage').then((m) => ({ default: m.CompanyOrdersPage })));
const ConversationsPage = lazy(() => import('./pages/chat/ConversationsPage').then((m) => ({ default: m.ConversationsPage })));
const ChatPage = lazy(() => import('./pages/chat/ChatPage').then((m) => ({ default: m.ChatPage })));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const UserProfilePage = lazy(() => import('./pages/profile/UserProfilePage').then((m) => ({ default: m.UserProfilePage })));
const CreatePostPage = lazy(() => import('./pages/create/CreatePostPage').then((m) => ({ default: m.CreatePostPage })));

// Super-app hub + mini-apps
const ServicesHubPage = lazy(() => import('./pages/services/ServicesHubPage').then((m) => ({ default: m.ServicesHubPage })));

// Rides (mobilidade)
const RidesHomePage = lazy(() => import('./pages/rides/RidesHomePage').then((m) => ({ default: m.RidesHomePage })));
const RideRequestPage = lazy(() => import('./pages/rides/RideRequestPage').then((m) => ({ default: m.RideRequestPage })));
const RideTrackPage = lazy(() => import('./pages/rides/RideTrackPage').then((m) => ({ default: m.RideTrackPage })));
const DriverDashboardPage = lazy(() => import('./pages/rides/DriverDashboardPage').then((m) => ({ default: m.DriverDashboardPage })));
const DriverRegisterPage = lazy(() => import('./pages/rides/DriverRegisterPage').then((m) => ({ default: m.DriverRegisterPage })));

// Delivery
const DeliveryHomePage = lazy(() => import('./pages/delivery/DeliveryHomePage').then((m) => ({ default: m.DeliveryHomePage })));
const RestaurantPage = lazy(() => import('./pages/delivery/RestaurantPage').then((m) => ({ default: m.RestaurantPage })));
const OrderTrackPage = lazy(() => import('./pages/delivery/OrderTrackPage').then((m) => ({ default: m.OrderTrackPage })));
const DeliveryOrdersPage = lazy(() => import('./pages/delivery/DeliveryOrdersPage').then((m) => ({ default: m.DeliveryOrdersPage })));
const RestaurantManagerPage = lazy(() => import('./pages/delivery/RestaurantManagerPage').then((m) => ({ default: m.RestaurantManagerPage })));

// News
const NewsPortalPage = lazy(() => import('./pages/news/NewsPortalPage').then((m) => ({ default: m.NewsPortalPage })));
const ArticlePage = lazy(() => import('./pages/news/ArticlePage').then((m) => ({ default: m.ArticlePage })));
const WriteArticlePage = lazy(() => import('./pages/news/WriteArticlePage').then((m) => ({ default: m.WriteArticlePage })));
const JournalistApplyPage = lazy(() => import('./pages/news/JournalistApplyPage').then((m) => ({ default: m.JournalistApplyPage })));
const JournalistPortalPage = lazy(() => import('./pages/news/JournalistPortalPage').then((m) => ({ default: m.JournalistPortalPage })));

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
      { path: '/classifieds/mine', element: <Page><MyClassifiedsPage /></Page> },
      { path: '/classifieds/:id', element: <Page><ClassifiedDetailPage /></Page> },
      { path: '/companies', element: <Page><CompaniesPage /></Page> },
      { path: '/companies/manage', element: <Page><CompanyManagerPage /></Page> },
      { path: '/companies/manage/orders', element: <Page><CompanyOrdersPage /></Page> },
      { path: '/companies/order/:id', element: <Page><CompanyOrderTrackPage /></Page> },
      { path: '/companies/:slug', element: <Page><CompanyProfilePage /></Page> },
      { path: '/chat', element: <Page><ConversationsPage /></Page> },
      { path: '/chat/:conversationId', element: <Page><ChatPage /></Page> },
      { path: '/profile', element: <Page><ProfilePage /></Page> },
      { path: '/profile/:id', element: <Page><UserProfilePage /></Page> },
      { path: '/create', element: <Page><CreatePostPage /></Page> },

      // Super-app hub
      { path: '/services', element: <Page><ServicesHubPage /></Page> },

      // Mobilidade (Rides)
      { path: '/rides', element: <Page><RidesHomePage /></Page> },
      { path: '/rides/request', element: <Page><RideRequestPage /></Page> },
      { path: '/rides/track/:id', element: <Page><RideTrackPage /></Page> },
      { path: '/rides/driver', element: <Page><DriverDashboardPage /></Page> },
      { path: '/rides/driver/register', element: <Page><DriverRegisterPage /></Page> },

      // Delivery
      { path: '/delivery', element: <Page><DeliveryHomePage /></Page> },
      { path: '/delivery/orders', element: <Page><DeliveryOrdersPage /></Page> },
      { path: '/delivery/restaurant/:slug', element: <Page><RestaurantPage /></Page> },
      { path: '/delivery/order/:id', element: <Page><OrderTrackPage /></Page> },
      { path: '/delivery/manage', element: <Page><RestaurantManagerPage /></Page> },

      // News
      { path: '/news', element: <Page><NewsPortalPage /></Page> },
      { path: '/news/article/:slug', element: <Page><ArticlePage /></Page> },
      { path: '/news/portal/:authorId', element: <Page><JournalistPortalPage /></Page> },
      { path: '/news/write', element: <Page><WriteArticlePage /></Page> },
      { path: '/news/apply', element: <Page><JournalistApplyPage /></Page> },
    ],
  },
]);
