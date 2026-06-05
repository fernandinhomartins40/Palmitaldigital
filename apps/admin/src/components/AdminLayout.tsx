import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Building2, UtensilsCrossed, Car,
  Newspaper, FileText, Users, CreditCard, LogOut, ShieldCheck, ExternalLink,
} from 'lucide-react';
import { useAdminAuth } from '../store';

const nav = [
  { to: '/dashboard',   label: 'Dashboard',       icon: LayoutDashboard },
  { to: '/companies',   label: 'Empresas',         icon: Building2 },
  { to: '/restaurants', label: 'Delivery',         icon: UtensilsCrossed },
  { to: '/drivers',     label: 'Motoristas',       icon: Car },
  { to: '/journalists', label: 'Jornalistas',      icon: Newspaper },
  { to: '/articles',    label: 'Artigos',          icon: FileText },
  { to: '/users',       label: 'Usuários',         icon: Users },
  { to: '/credits',     label: 'Créditos & Planos',icon: CreditCard },
];

export function AdminLayout() {
  const { token, adminUser, logout } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || adminUser?.role !== 'ADMIN') navigate('/login', { replace: true });
  }, [token, adminUser, navigate]);

  if (!token) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight">Palmital Admin</p>
            <p className="text-[11px] text-gray-400 truncate max-w-[130px]">{adminUser?.email}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-3 space-y-1">
          <a
            href={import.meta.env.VITE_APP_URL || 'https://www.palmitaldigital.com.br'}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <ExternalLink size={15} />
            Abrir aplicativo
          </a>
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
