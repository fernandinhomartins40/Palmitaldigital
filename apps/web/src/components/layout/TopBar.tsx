import { Link, useLocation } from 'react-router-dom';
import { MessageCircle, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const titles: Record<string, string> = {
  '/': 'Feed',
  '/classifieds': 'Classificados',
  '/companies': 'Empresas',
  '/chat': 'Mensagens',
  '/profile': 'Perfil',
  '/create': 'Nova publicação',
};

export function TopBar() {
  const { pathname } = useLocation();
  const title = titles[pathname] ?? 'Palmital Digital';
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
    conversations?.filter((c) => {
      const lastMsg = c.messages?.[0];
      if (!lastMsg) return false;
      const participation = c.participants?.find(
        (p: any) => p.userId === currentUser?.id,
      );
      return (
        participation &&
        (!participation.lastReadAt ||
          new Date(lastMsg.createdAt) > new Date(participation.lastReadAt))
      );
    }).length ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 h-14 shadow-sm">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
            <MapPin size={14} className="text-white" />
          </div>
          <span className="text-base font-bold text-blue-700 tracking-tight">Palmital Digital</span>
        </Link>

        <div className="flex items-center gap-1 text-sm font-semibold text-gray-500">
          {title !== 'Palmital Digital' && title !== 'Feed' ? title : ''}
        </div>

        <Link to="/chat" className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <MessageCircle size={22} className="text-gray-600" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-bold shadow-sm">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
