import { Link, useLocation } from 'react-router-dom';
import { Home, Tag, PlusSquare, MessageCircle, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Feed' },
  { to: '/classifieds', icon: Tag, label: 'Classificados' },
  { to: '/create', icon: PlusSquare, label: 'Publicar', primary: true },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

export function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 safe-bottom">
      <div className="max-w-lg mx-auto flex h-16">
        {navItems.map(({ to, icon: Icon, label, primary }) => {
          const isActive = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors ${
                primary
                  ? 'text-blue-600'
                  : isActive
                  ? 'text-blue-600'
                  : 'text-gray-400'
              }`}
            >
              <Icon size={primary ? 26 : 22} strokeWidth={primary ? 1.5 : isActive ? 2 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
