import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Avatar, Spinner } from '@palmital/ui';
import { Send } from 'lucide-react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { ChatSidebar } from '../../components/chat/ChatSidebar';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const { sendMessage, startTyping, stopTyping, markRead, isTyping } = useChat(conversationId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const { data, isLoading, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }) => {
      const params: any = { limit: 30 };
      if (pageParam) params.cursor = pageParam;
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, { params });
      return data as { messages: any[]; nextCursor: string | null };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!conversationId,
  });

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/chat/conversations');
      return data as any[];
    },
    enabled: !!currentUser,
  });

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];
  const activeConversation = conversations?.find((conversation) => conversation.id === conversationId);
  const otherParticipant = activeConversation?.participants?.find(
    (participant: any) => participant.userId !== currentUser?.id,
  );
  const otherProfile = otherParticipant?.user?.profile;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isTyping]);

  useEffect(() => {
    if (!conversationId || !messages.length) return;
    markRead();
  }, [conversationId, markRead, messages.length]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setText(e.target.value);
    startTyping();
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 1500);
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(text.trim());
    setText('');
    stopTyping();
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-6 lg:px-0">
      <div className="lg:grid lg:grid-cols-[360px,minmax(0,1fr)] lg:gap-6">
        <div className="hidden lg:block">
          <ChatSidebar activeConversationId={conversationId} />
        </div>

        <div className="flex h-[calc(100vh-8.75rem)] min-h-[32rem] flex-col overflow-hidden rounded-[32px] border border-white/80 bg-[linear-gradient(to_bottom,_#f8fbff,_#eef5ff)] shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="border-b border-white/80 bg-white/80 px-4 py-3 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Avatar
                src={otherProfile?.avatarUrl}
                name={otherProfile?.displayName ?? otherParticipant?.user?.email ?? 'Usuário'}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {otherProfile?.displayName ?? otherParticipant?.user?.email ?? 'Usuário'}
                </p>
                <p className="truncate text-xs text-gray-500">
                  {isTyping ? 'digitando...' : otherProfile?.city || 'Conversa privada'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {hasNextPage && (
              <button onClick={() => fetchNextPage()} className="w-full py-2 text-center text-xs text-blue-600">
                Carregar mensagens anteriores
              </button>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === currentUser?.id;
              const profile = msg.sender?.profile;
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="xs" />}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                      isMe
                        ? 'rounded-tr-sm bg-blue-600 text-white'
                        : 'rounded-tl-sm bg-white text-gray-900 shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {isTyping && (
              <div className="flex gap-2">
                <Avatar
                  src={otherProfile?.avatarUrl}
                  name={otherProfile?.displayName ?? otherParticipant?.user?.email ?? '?'}
                  size="xs"
                />
                <div className="rounded-2xl rounded-tl-sm bg-white px-3 py-2 text-sm text-gray-500 shadow-sm">
                  digitando...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-white/80 bg-white/90 px-4 py-3">
            <input
              value={text}
              onChange={handleInput}
              placeholder="Mensagem..."
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
