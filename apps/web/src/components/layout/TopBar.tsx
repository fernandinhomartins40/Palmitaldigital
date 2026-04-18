import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

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

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
    refetchInterval: 30000,
  });

  const unread = conversations?.filter((c) => {
    const lastMsg = c.messages?.[0];
    if (!lastMsg) return false;
    const participation = c.participants?.find((p: any) => p.userId === 'me');
    return participation && (!participation.lastReadAt || new Date(lastMsg.createdAt) > new Date(participation.lastReadAt));
  }).length ?? 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 h-14">
      <div className="max-w-lg mx-auto h-full flex items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold text-blue-600">Palmital Digital</Link>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">{title !== 'Palmital Digital' ? title : ''}</div>
        <Link to="/chat" className="relative p-2">
          <MessageCircle size={22} className="text-gray-600" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unread}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
