import { Avatar } from '@palmital/ui';
import { ArrowUpRight, ChevronRight, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { desktopNavItems, isNavItemActive } from './navigation';

const accentByPath: Record<string, { halo: string; dot: string }> = {
  '/feed': { halo: 'halo-coral', dot: 'bg-coral' },
  '/classifieds': { halo: 'halo-citrus', dot: 'bg-citrus' },
  '/companies': { halo: 'halo-cobalt', dot: 'bg-cobalt' },
  '/chat': { halo: 'halo-mint', dot: 'bg-mint' },
  '/profile': { halo: 'halo-magenta', dot: 'bg-magenta' },
};

export function DesktopSidebar() {
  const { pathname } = useLocation();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.profile?.displayName ?? user?.email ?? 'Palmital Digital';

  return (
    <div className="space-y-4">
      {/* Perfil card */}
      <div className="glass shape-signature p-4">
        <div className="flex items-center gap-3">
          <Avatar src={user?.profile?.avatarUrl} name={displayName} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold text-ink">{displayName}</p>
            <p className="truncate font-mono text-[10px] uppercase tracking-wider text-mute">
              {user?.email}
            </p>
          </div>
        </div>

        <Link
          to="/profile"
          className="mt-4 flex items-center justify-between rounded-xl bg-ink/5 px-3 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10"
        >
          <span className="font-mono uppercase tracking-wider">Gerenciar</span>
          <ChevronRight size={14} className="text-mute" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="glass shape-signature space-y-1 p-2">
        {desktopNavItems.map(({ to, icon: Icon, label }) => {
          const isActive = isNavItemActive(pathname, to);
          const accent = accentByPath[to];

          return (
            <Link
              key={to}
              to={to}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-ink/[0.06] text-ink dark:bg-white/[0.08]'
                  : 'text-mute hover:bg-ink/[0.03] hover:text-ink dark:hover:bg-white/[0.04]'
              }`}
            >
              {isActive && accent && (
                <span className={`absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r ${accent.dot}`} />
              )}
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-lg ${
                  isActive ? `halo ${accent?.halo ?? ''}` : ''
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2.4 : 1.8} />
              </div>
              <span className="font-display tracking-tight">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* CTA publicar — preto sólido, sem gradiente */}
      <Link
        to="/create"
        className="group halo halo-coral relative block overflow-hidden rounded-glass-lg bg-ink p-5 text-surface shadow-lg transition-all hover:-translate-y-0.5"
      >
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-coral px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
              <Sparkles size={10} />
              Publicar
            </div>
            <p className="mt-3 font-display text-lg font-bold leading-tight">
              Compartilhe algo<br />com Palmital
            </p>
            <p className="mt-1 text-xs leading-5 text-surface/60">
              Foto, vídeo, classificado ou novidade da empresa.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral text-white transition-transform group-hover:scale-110">
            <ArrowUpRight size={18} strokeWidth={2.4} />
          </div>
        </div>
      </Link>
    </div>
  );
}
