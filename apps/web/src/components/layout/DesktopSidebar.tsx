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
        className="group relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_52%,#5b5ce2_100%)] px-5 py-5 text-white shadow-[0_18px_40px_rgba(37,99,235,0.24)] transition-all hover:-translate-y-0.5 hover:shadow-[0_24px_52px_rgba(37,99,235,0.3)]"
      >
        <div className="absolute inset-y-0 right-0 w-32 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_62%)]" />
        <div className="absolute -right-5 bottom-3 h-20 w-20 rounded-full bg-white/10 blur-sm" />

        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-50/95 backdrop-blur-sm">
              <Sparkles size={12} />
              Publicar
            </div>
            <p className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.02em]">
              Compartilhe algo novo
            </p>
            <p className="mt-1 max-w-[14rem] text-sm leading-5 text-blue-50/88">
              Poste foto, vídeo, oferta ou atualização para aparecer no feed.
            </p>
          </div>

          <div className="relative shrink-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-white/20 bg-white/16 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] backdrop-blur-sm transition-transform group-hover:scale-105">
              <ImagePlus size={28} strokeWidth={2.1} />
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
