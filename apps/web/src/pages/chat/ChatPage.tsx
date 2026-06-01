import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Avatar, Spinner } from '@palmital/ui';
import { Check, CheckCheck, Send } from 'lucide-react';
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
    <div className="lg:grid lg:grid-cols-[360px,minmax(0,1fr)] lg:gap-6">
      <div className="hidden lg:block">
        <ChatSidebar activeConversationId={conversationId} />
      </div>

      <div className="glass shape-signature-lg flex h-[calc(100vh-9rem)] min-h-[32rem] flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar
                src={otherProfile?.avatarUrl}
                name={otherProfile?.displayName ?? otherParticipant?.user?.email ?? 'Usuário'}
                size="md"
              />
              {isTyping && <span className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full bg-mint ring-2 ring-surface dark:ring-canvas" />}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold text-ink">
                {otherProfile?.displayName ?? otherParticipant?.user?.email ?? 'Usuário'}
              </p>
              <p className="truncate font-mono text-[10px] uppercase tracking-wider text-mute">
                {isTyping ? 'digitando...' : otherProfile?.city || 'Conversa privada'}
              </p>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="glass-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {hasNextPage && (
            <button
              onClick={() => fetchNextPage()}
              className="w-full py-2 text-center font-mono text-[10px] font-bold uppercase tracking-wider text-coral hover:underline"
            >
              ↑ Mensagens anteriores
            </button>
          )}
          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const profile = msg.sender?.profile;
            const time = msg.createdAt
              ? new Date(msg.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
              : '';
            const isRead = msg.status === 'READ';
            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="xs" />}
                <div
                  className={`max-w-[78%] px-4 py-2.5 text-sm leading-5 ${
                    isMe
                      ? 'halo halo-coral bg-coral text-white'
                      : 'glass-strong text-ink'
                  }`}
                  style={{
                    borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  }}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  <span
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                      isMe ? 'justify-end text-white/70' : 'text-mute'
                    }`}
                  >
                    {time}
                    {isMe &&
                      (isRead ? (
                        <CheckCheck size={13} strokeWidth={2.4} className="text-white" />
                      ) : (
                        <Check size={13} strokeWidth={2.4} className="text-white/70" />
                      ))}
                  </span>
                </div>
              </div>
            );
          })}
          {isTyping && (
            <div className="flex items-end gap-2">
              <Avatar
                src={otherProfile?.avatarUrl}
                name={otherProfile?.displayName ?? otherParticipant?.user?.email ?? '?'}
                size="xs"
              />
              <div
                className="glass-strong flex items-center gap-1 px-4 py-3"
                style={{ borderRadius: '20px 20px 20px 4px' }}
              >
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: '0ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: '150ms' }} />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-mute" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-line px-4 py-3">
          <input
            value={text}
            onChange={handleInput}
            placeholder="Mensagem..."
            className="flex-1 rounded-2xl border border-line bg-ink/[0.03] px-4 py-2.5 text-sm text-ink outline-none placeholder:text-subtle focus:border-coral focus:bg-surface focus:ring-2 focus:ring-coral/15 dark:bg-white/[0.03]"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="halo halo-coral flex h-11 w-11 items-center justify-center rounded-2xl bg-coral text-white transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send size={16} strokeWidth={2.2} />
          </button>
        </form>
      </div>
    </div>
  );
}
