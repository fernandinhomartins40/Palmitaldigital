import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useChat(conversationId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = connectSocket();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !conversationId) return;

    socket.emit('join_conversation', { conversationId });

    const handleNewMessage = (message: any) => {
      queryClient.setQueryData(['messages', conversationId], (old: any) => {
        if (!old) return old;
        const pages = [...old.pages];
        const last = { ...pages[pages.length - 1] };
        last.messages = [...(last.messages ?? []), message];
        pages[pages.length - 1] = last;
        return { ...old, pages };
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message', handleNewMessage);
    };
  }, [conversationId, queryClient]);

  function sendMessage(content: string) {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('send_message', { conversationId, content });
  }

  function startTyping() {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('typing_start', { conversationId });
  }

  function stopTyping() {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('typing_stop', { conversationId });
  }

  return { sendMessage, startTyping, stopTyping };
}
