import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const titles: Record<string, string> = {
  '/feed': 'Feed',
  '/classifieds': 'Classificados',
  '/companies': 'Empresas',
  '/chat': 'Mensagens',
  '/profile': 'Perfil',
  '/create': 'Nova publicação',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = pathname.startsWith('/profile/')
    ? 'Perfil público'
    : pathname.startsWith('/chat/')
      ? 'Mensagens'
      : titles[pathname] ?? 'Palmital Digital';
  const currentUser = useAuthStore((s) => s.user);

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
    refetchInterval: 30000,
    enabled: !!currentUser,
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
    <header className="fixed left-0 right-0 top-0 z-40 h-14 border-b border-gray-100 bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 lg:px-6">
        <Link to="/feed" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <MapPin size={14} className="text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-blue-700">Palmital Digital</span>
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 text-center text-sm font-semibold text-gray-500">
          {title !== 'Palmital Digital' && title !== 'Feed' ? title : ''}
        </div>

        <Link to="/chat" className="relative rounded-xl p-2 transition-colors hover:bg-gray-100">
          <MessageCircle size={22} className="text-gray-600" />
          {unread > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
