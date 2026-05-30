import { Link, useLocation } from 'react-router-dom';
import { isNavItemActive, mobileNavItems } from './navigation';

const accentByPath: Record<string, string> = {
  '/feed': 'halo-coral',
  '/classifieds': 'halo-citrus',
  '/chat': 'halo-cobalt',
  '/profile': 'halo-magenta',
};

const dotByPath: Record<string, string> = {
  '/feed': 'bg-coral',
  '/classifieds': 'bg-citrus',
  '/chat': 'bg-cobalt',
  '/profile': 'bg-magenta',
};

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="safe-bottom fixed bottom-3 left-3 right-3 z-40 lg:hidden">
      <div className="glass shape-signature mx-auto flex h-16 max-w-md items-center px-2">
        {mobileNavItems.map(({ to, icon: Icon, label, primary }) => {
          const isActive = isNavItemActive(pathname, to);

          if (primary) {
            return (
              <Link
                key={to}
                to={to}
                className="flex flex-1 flex-col items-center justify-center"
                aria-label={label}
              >
                <div className="halo halo-coral relative -mt-7 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-surface shadow-lg ring-4 ring-surface dark:ring-canvas">
                  <Icon size={22} strokeWidth={2.2} />
                </div>
              </Link>
            );
          }

          return (
            <Link
              key={to}
              to={to}
              className="group flex flex-1 flex-col items-center justify-center gap-1"
              aria-label={label}
            >
              <div
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                  isActive ? `halo ${accentByPath[to] ?? ''} text-ink` : 'text-mute group-hover:text-ink'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              </div>
              <span
                className={`h-1 w-1 rounded-full transition-all ${
                  isActive ? `${dotByPath[to] ?? 'bg-ink'} w-4` : 'bg-transparent'
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
