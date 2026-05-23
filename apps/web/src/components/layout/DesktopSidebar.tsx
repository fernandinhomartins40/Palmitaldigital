import { Avatar, Card } from '@palmital/ui';
import { ArrowUpRight, ChevronRight, ImagePlus, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { desktopNavItems, isNavItemActive } from './navigation';

export function DesktopSidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.profile?.displayName ?? user?.email ?? 'Palmital Digital';

  return (
    <div className="space-y-3 xl:space-y-4">
      <Card className="rounded-2xl border-blue-100/80 p-3 shadow-[0_10px_30px_rgba(37,99,235,0.08)] xl:rounded-[28px] xl:p-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={user?.profile?.avatarUrl}
            name={displayName}
            size="lg"
            className="h-12 w-12 text-lg xl:h-14 xl:w-14 xl:text-xl"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>

        <Link
          to="/profile"
          className="mt-3 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 xl:mt-4 xl:rounded-2xl xl:py-3"
        >
          Gerenciar conta
          <ChevronRight size={16} className="text-gray-400" />
        </Link>
      </Card>

      <Card className="rounded-2xl p-1.5 shadow-sm xl:rounded-[28px] xl:p-2">
        <nav className="space-y-1">
          {desktopNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = isNavItemActive(pathname, to);

            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors xl:gap-3 xl:rounded-2xl xl:px-3 xl:py-3 ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div
                  className={`rounded-lg p-1.5 xl:rounded-xl xl:p-2 ${
                    isActive ? 'bg-white shadow-sm' : 'bg-gray-50'
                  }`}
                >
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
        className="group relative block w-full overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_52%,#5b5ce2_100%)] px-4 py-4 text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(37,99,235,0.3)] xl:rounded-[30px] xl:px-5 xl:py-5"
      >
        <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_62%)]" />
        <div className="absolute -right-5 bottom-3 h-20 w-20 rounded-full bg-white/10 blur-sm" />

        <div className="relative grid min-h-[116px] grid-cols-[minmax(0,1fr)_auto] items-start gap-3 xl:min-h-[164px] xl:gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-50/95 backdrop-blur-sm xl:gap-2 xl:px-2.5 xl:text-[11px] xl:tracking-[0.22em]">
              <Sparkles size={12} />
              Publicar
            </div>
            <p className="mt-3 text-lg font-semibold leading-tight xl:text-[22px]">
              Compartilhe algo novo
            </p>
            <p className="mt-1 hidden max-w-[14rem] text-sm leading-5 text-blue-50/88 xl:block">
              Poste foto, video, oferta ou atualizacao para aparecer no feed.
            </p>
          </div>

          <div className="relative mt-1 shrink-0 justify-self-end">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-sm transition-transform group-hover:scale-105 xl:h-16 xl:w-16 xl:rounded-[22px]">
              <ImagePlus size={24} strokeWidth={2.1} className="xl:h-7 xl:w-7" />
            </div>
            <div className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-white shadow-lg">
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
