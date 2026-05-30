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
    <div className="glass shape-signature overflow-hidden">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="halo halo-cobalt flex h-10 w-10 items-center justify-center rounded-xl bg-cobalt text-white">
            <MessageCircle size={18} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="font-display text-base font-bold tracking-tight text-ink">Conversas</h2>
            <p className="font-mono text-[10px] uppercase tracking-wider text-mute">
              Mensagens diretas
            </p>
          </div>
        </div>

        <label className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-ink/[0.03] px-3 py-2.5 focus-within:border-coral focus-within:bg-surface focus-within:ring-2 focus-within:ring-coral/15 dark:bg-white/[0.03]">
          <Search size={16} className="text-mute" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email"
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-subtle"
          />
          {isSearching && <Spinner size="sm" />}
        </label>
      </div>

      <div className="glass-scrollbar max-h-[calc(100vh-16rem)] overflow-y-auto">
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
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                        isActive
                          ? 'bg-cobalt/[0.08] dark:bg-cobalt/[0.15]'
                          : 'hover:bg-ink/[0.03] active:bg-ink/[0.06] dark:hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="relative">
                        {isActive && (
                          <span className="halo halo-cobalt absolute inset-0 rounded-full" />
                        )}
                        <Avatar
                          src={profile?.avatarUrl}
                          name={profile?.displayName ?? other?.user?.email ?? '?'}
                          size="md"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate font-display text-sm font-bold text-ink">
                            {profile?.displayName ?? other?.user?.email ?? 'Usuário'}
                          </span>
                          {lastMsg && (
                            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-mute">
                              {formatRelativeTime(lastMsg.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-sm text-mute">
                          {lastMsg?.content ?? 'Toque para iniciar'}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {deferredSearch.length >= 2 && (
              <div className="border-t border-line px-4 pb-3 pt-4">
                <div className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-wider text-mute">
                  <UserRoundSearch size={12} />
                  Pessoas encontradas
                </div>

                {!users?.length ? (
                  <p className="rounded-2xl bg-ink/[0.03] px-3 py-4 text-sm text-mute dark:bg-white/[0.03]">
                    Nenhuma pessoa encontrada.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => startConversationMutation.mutate(user.id)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-line px-3 py-3 text-left transition-colors hover:border-cobalt hover:bg-cobalt/[0.05]"
                        disabled={startConversationMutation.isPending}
                      >
                        <Avatar
                          src={user.profile?.avatarUrl}
                          name={user.profile?.displayName ?? user.email}
                          size="md"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-sm font-bold text-ink">
                            {user.profile?.displayName ?? user.email}
                          </p>
                          <p className="truncate font-mono text-[10px] uppercase tracking-wider text-mute">
                            {user.profile?.city || user.email}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cobalt">
                          Iniciar →
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!filteredConversations.length && !deferredSearch && (
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <MessageCircle size={44} strokeWidth={1.2} className="text-mute" />
                <p className="mt-3 font-display text-base font-bold text-ink">Sem conversas</p>
                <p className="mt-1 text-sm text-mute">Busque por nome para iniciar.</p>
              </div>
            )}

            {!filteredConversations.length &&
              deferredSearch.length > 0 &&
              deferredSearch.length < 2 && (
                <div className="px-4 py-6 text-sm text-mute">
                  Digite ao menos 2 caracteres para buscar.
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
