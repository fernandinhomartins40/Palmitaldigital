import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Avatar, Spinner } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { MessageCircle } from 'lucide-react';

export function ConversationsPage() {
  const currentUser = useAuthStore((s) => s.user);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;
  }

  if (!conversations?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <MessageCircle size={48} strokeWidth={1} />
        <p className="mt-3 text-lg font-medium">Nenhuma conversa ainda</p>
        <p className="text-sm">Inicie uma conversa a partir de um anúncio ou perfil</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conv) => {
        const other = conv.participants?.find((p: any) => p.userId !== currentUser?.id);
        const profile = other?.user?.profile;
        const lastMsg = conv.messages?.[0];

        return (
          <Link key={conv.id} to={`/chat/${conv.id}`} className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100">
            <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-900">{profile?.displayName ?? 'Usuário'}</span>
                {lastMsg && <span className="text-xs text-gray-400">{formatRelativeTime(lastMsg.createdAt)}</span>}
              </div>
              <p className="text-sm text-gray-500 truncate">{lastMsg?.content ?? 'Inicie a conversa'}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
