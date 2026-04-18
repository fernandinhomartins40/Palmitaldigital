import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar, Spinner } from '@palmital/ui';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { Send } from 'lucide-react';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const { sendMessage, startTyping, stopTyping } = useChat(conversationId);
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

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

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

  if (isLoading) return <div className="flex justify-center py-12"><Spinner size="lg" /></div>;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {hasNextPage && (
          <button onClick={() => fetchNextPage()} className="w-full text-center text-xs text-blue-600 py-2">
            Carregar mensagens anteriores
          </button>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          const profile = msg.sender?.profile;
          return (
            <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              {!isMe && <Avatar src={profile?.avatarUrl} name={profile?.displayName ?? '?'} size="xs" />}
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-900 rounded-tl-sm shadow-sm'}`}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-4 py-3 bg-white border-t">
        <input
          value={text}
          onChange={handleInput}
          placeholder="Mensagem..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm outline-none focus:border-blue-500"
          autoComplete="off"
        />
        <button type="submit" disabled={!text.trim()} className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
