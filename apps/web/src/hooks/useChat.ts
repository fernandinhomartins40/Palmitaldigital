import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useChat(conversationId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);
  const [isTyping, setIsTyping] = useState(false);

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

    const handleTyping = () => setIsTyping(true);
    const handleStoppedTyping = () => setIsTyping(false);

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStoppedTyping);

    return () => {
      socket.emit('leave_conversation', { conversationId });
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStoppedTyping);
      setIsTyping(false);
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

  function markRead() {
    if (!conversationId || !socketRef.current) return;
    socketRef.current.emit('mark_read', { conversationId });
  }

  return { sendMessage, startTyping, stopTyping, markRead, isTyping };
}
