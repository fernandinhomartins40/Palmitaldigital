import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket } from '../services/socket';

export function useChat(conversationId?: string) {
  const queryClient = useQueryClient();
  const socketRef = useRef(connectSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (conversationId) {
      socket.emit('join_conversation', { conversationId });

      socket.on('new_message', (message: any) => {
        queryClient.setQueryData(['messages', conversationId], (old: any) => {
          if (!old) return old;
          const pages = [...old.pages];
          const last = { ...pages[pages.length - 1] };
          last.messages = [...last.messages, message];
          pages[pages.length - 1] = last;
          return { ...old, pages };
        });
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      });
    }

    return () => {
      if (conversationId) {
        socket.emit('leave_conversation', { conversationId });
        socket.off('new_message');
      }
    };
  }, [conversationId, queryClient]);

  function sendMessage(content: string) {
    if (!conversationId) return;
    socketRef.current.emit('send_message', { conversationId, content });
  }

  function startTyping() {
    if (!conversationId) return;
    socketRef.current.emit('typing_start', { conversationId });
  }

  function stopTyping() {
    if (!conversationId) return;
    socketRef.current.emit('typing_stop', { conversationId });
  }

  return { sendMessage, startTyping, stopTyping };
}
