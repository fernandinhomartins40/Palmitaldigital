import { Avatar, Card } from '@palmital/ui';
import { ChevronRight, PlusCircle } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { desktopNavItems, isNavItemActive } from './navigation';

export function DesktopSidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.profile?.displayName ?? user?.email ?? 'Palmital Digital';

  return (
    <div className="sticky top-20 space-y-4">
      <Card className="rounded-[28px] border-blue-100/80 p-4 shadow-[0_10px_30px_rgba(37,99,235,0.08)]">
        <div className="flex items-center gap-3">
          <Avatar src={user?.profile?.avatarUrl} name={displayName} size="lg" className="h-14 w-14 text-xl" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <Link
          to="/profile"
          className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Gerenciar conta
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </Card>

      <Card className="rounded-[28px] p-2 shadow-sm">
        <nav className="space-y-1">
          {desktopNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = isNavItemActive(pathname, to);

            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`rounded-xl p-2 ${isActive ? 'bg-white shadow-sm' : 'bg-gray-50'}`}>
                  <Icon size={18} strokeWidth={isActive ? 2.2 : 1.9} />
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </Card>

      <Link
        to="/create"
        className="flex items-center justify-between rounded-[28px] bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-500 px-4 py-4 text-white shadow-lg shadow-blue-200/70 transition-transform hover:-translate-y-0.5"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Ação rápida</p>
          <p className="mt-1 text-base font-semibold">Criar nova publicação</p>
        </div>
        <div className="rounded-2xl bg-white/15 p-3">
          <PlusCircle size={20} />
        </div>
      </Link>
    </div>
  );
}
