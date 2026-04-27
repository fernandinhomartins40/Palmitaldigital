import { Link, useLocation } from 'react-router-dom';
import { Home, MessageCircle, PlusCircle, Tag, User } from 'lucide-react';

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/classifieds', icon: Tag, label: 'Classificados' },
  { to: '/create', icon: PlusCircle, label: 'Publicar', primary: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 shadow-[0_-1px_6px_rgba(0,0,0,0.06)] backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-lg items-center">
        {navItems.map(({ to, icon: Icon, label, primary }) => {
          const isActive =
            to === '/profile'
              ? pathname === '/profile' || pathname.startsWith('/profile/')
              : pathname === to;

          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-all ${
                primary ? '' : isActive ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {primary ? (
                <div className="flex flex-col items-center gap-0.5">
                  <div className="-mt-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-200">
                    <Icon size={20} className="text-white" strokeWidth={2} />
                  </div>
                  <span className="text-[10px] font-semibold text-blue-600">{label}</span>
                </div>
              ) : (
                <>
                  <div className={`rounded-xl p-1.5 transition-colors ${isActive ? 'bg-blue-50' : ''}`}>
                    <Icon size={21} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-blue-600' : ''}`}>
                    {label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
