import { useDeferredValue, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Spinner } from '@palmital/ui';
import { formatRelativeTime } from '@palmital/utils';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Search, UserRoundSearch } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

interface ChatSidebarProps {
  activeConversationId?: string;
}

function getOtherParticipant(conversation: any, currentUserId?: string) {
  return conversation.participants?.find((participant: any) => participant.userId !== currentUserId);
}

export function ChatSidebar({ activeConversationId }: ChatSidebarProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const addToast = useUIStore((s) => s.addToast);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim());

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
    enabled: !!currentUser,
  });

  const { data: users, isFetching: isSearching } = useQuery({
    queryKey: ['chat-user-search', deferredSearch],
    queryFn: async () => {
      const { data } = await api.get('/users/search', { params: { q: deferredSearch, limit: 10 } });
      return data as any[];
    },
    enabled: deferredSearch.length >= 2,
  });

  const startConversationMutation = useMutation({
    mutationFn: async (recipientId: string) => {
      const { data } = await api.post('/chat/conversations', { recipientId });
      return data as { id: string };
    },
    onSuccess: (conversation) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      navigate(`/chat/${conversation.id}`);
    },
    onError: (error: any) => {
      addToast(error.response?.data?.message || 'Erro ao iniciar conversa', 'error');
    },
  });

  const filteredConversations = useMemo(() => {
    if (!conversations) return [];
    if (!deferredSearch) return conversations;

    const term = deferredSearch.toLocaleLowerCase();
    return conversations.filter((conversation) => {
      const other = getOtherParticipant(conversation, currentUser?.id);
      const displayName = other?.user?.profile?.displayName?.toLocaleLowerCase() ?? '';
      const email = other?.user?.email?.toLocaleLowerCase() ?? '';
      return displayName.includes(term) || email.includes(term);
    });
  }, [conversations, currentUser?.id, deferredSearch]);

  return (
    <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/95 shadow-[0_12px_30px_rgba(15,23,42,0.06)] backdrop-blur-sm">
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <MessageCircle size={20} />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Conversas</h2>
            <p className="text-sm text-gray-500">Busque pessoas e continue o atendimento.</p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-3 focus-within:border-blue-500 focus-within:bg-white">
          <Search size={18} className="text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="w-full bg-transparent text-sm text-gray-700 outline-none"
          />
          {isSearching && <Spinner size="sm" />}
        </label>
      </div>

      <div className="max-h-[calc(100vh-14rem)] overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {filteredConversations.length > 0 && (
              <div className="px-2 py-2">
                {filteredConversations.map((conversation) => {
                  const other = getOtherParticipant(conversation, currentUser?.id);
                  const profile = other?.user?.profile;
                  const lastMsg = conversation.messages?.[0];
                  const isActive = conversation.id === activeConversationId;

                  return (
                    <Link
                      key={conversation.id}
                      to={`/chat/${conversation.id}`}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${
                        isActive ? 'bg-blue-50' : 'hover:bg-gray-50 active:bg-gray-100'
                      }`}
                    >
                      <Avatar
                        src={profile?.avatarUrl}
                        name={profile?.displayName ?? other?.user?.email ?? '?'}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-semibold text-gray-900">
                            {profile?.displayName ?? other?.user?.email ?? 'Usuário'}
                          </span>
                          {lastMsg && (
                            <span className="shrink-0 text-xs text-gray-400">
                              {formatRelativeTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-gray-500">
                          {lastMsg?.content ?? 'Toque para iniciar a conversa'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {deferredSearch.length >= 2 && (
              <div className="border-t border-gray-100 px-4 pb-3 pt-4">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
                  <UserRoundSearch size={14} />
                  Usuários encontrados
                </div>

                {!users?.length ? (
                  <p className="rounded-2xl bg-gray-50 px-3 py-4 text-sm text-gray-500">
                    Nenhum usuário encontrado para essa busca.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => startConversationMutation.mutate(user.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 px-3 py-3 text-left transition-colors hover:bg-gray-50"
                        disabled={startConversationMutation.isPending}
                      >
                        <Avatar
                          src={user.profile?.avatarUrl}
                          name={user.profile?.displayName ?? user.email}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {user.profile?.displayName ?? user.email}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {user.profile?.city || user.email}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">Conversar</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!filteredConversations.length && !deferredSearch && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center text-gray-400">
                <MessageCircle size={44} strokeWidth={1.4} />
                <p className="mt-3 text-base font-medium text-gray-600">Nenhuma conversa ainda</p>
                <p className="mt-1 text-sm">Busque pelo nome de um usuário para iniciar.</p>
              </div>
            )}

            {!filteredConversations.length && deferredSearch.length > 0 && deferredSearch.length < 2 && (
              <div className="px-4 py-6 text-sm text-gray-500">
                Digite pelo menos 2 caracteres para buscar novos usuários.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
