import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Moon, ShoppingBag, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useCompanyCartStore } from '../../store/companyCartStore';
import { useUIStore } from '../../store/uiStore';

const titles: Record<string, string> = {
  '/feed': 'Feed',
  '/classifieds': 'Mercado',
  '/companies': 'Empresas',
  '/companies/manage': 'Minha empresa',
  '/chat': 'Conversas',
  '/profile': 'Perfil',
  '/create': 'Publicar',
};

export function TopBar() {
  const { pathname } = useLocation();
  const currentUser = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);
  const cartCount = useCompanyCartStore((s) => s.totalItemCount());
  const setCartOpen = useUIStore((s) => s.setCartDrawerOpen);

  const title =
    titles[pathname] ??
    (pathname.startsWith('/profile/')
      ? 'Perfil'
      : pathname.startsWith('/companies/')
        ? 'Empresa'
        : pathname.startsWith('/chat/')
          ? 'Conversa'
          : 'Palmital');

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
    refetchInterval: 30000,
    enabled: Boolean(isAuthenticated && accessToken && currentUser),
  });

  const unread =
    conversations?.filter((conversation) => {
      const lastMsg = conversation.messages?.[0];
      if (!lastMsg) return false;
      const participation = conversation.participants?.find(
        (participant: any) => participant.userId === currentUser?.id,
      );
      return (
        participation &&
        (!participation.lastReadAt ||
          new Date(lastMsg.createdAt) > new Date(participation.lastReadAt))
      );
    }).length ?? 0;

  return (
    <header className="fixed left-0 right-0 top-0 z-40 px-3 pt-3 lg:px-6 lg:pt-4">
      <div className="glass shape-signature mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 lg:h-16 lg:px-5">
        <Link to="/feed" className="flex items-center gap-2.5">
          <div className="halo halo-coral relative flex h-8 w-8 items-center justify-center rounded-xl bg-coral text-white">
            <span className="font-display text-base font-black">P</span>
          </div>
          <div className="leading-none">
            <span className="block font-display text-base font-bold tracking-tight text-ink">
              Palmital
            </span>
            <span className="block text-[10px] font-mono uppercase tracking-[0.18em] text-mute">
              {title}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            aria-label="Carrinho"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cobalt px-1 text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <Link
            to={isAuthenticated ? '/chat' : '/login'}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink transition-colors hover:bg-ink/5 dark:hover:bg-white/5"
          >
            <MessageCircle size={20} />
            {unread > 0 && (
              <span className="halo halo-coral absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
