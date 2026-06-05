import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { AdminLayout } from './components/AdminLayout';
import { DashboardPage } from './pages/DashboardPage';
import { CompaniesPage } from './pages/CompaniesPage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { DriversPage } from './pages/DriversPage';
import { JournalistsPage } from './pages/JournalistsPage';
import { ArticlesPage } from './pages/ArticlesPage';
import { UsersPage } from './pages/UsersPage';
import { CreditsPage } from './pages/CreditsPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard',   element: <DashboardPage /> },
      { path: 'companies',   element: <CompaniesPage /> },
      { path: 'restaurants', element: <RestaurantsPage /> },
      { path: 'drivers',     element: <DriversPage /> },
      { path: 'journalists', element: <JournalistsPage /> },
      { path: 'articles',    element: <ArticlesPage /> },
      { path: 'users',       element: <UsersPage /> },
      { path: 'credits',     element: <CreditsPage /> },
    ],
  },
]);
