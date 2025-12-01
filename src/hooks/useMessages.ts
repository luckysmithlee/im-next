import { useState, useEffect } from 'react';
import type { MessageStore } from '@/stores/messageStore';
import type { Message } from '@/types';

export function useMessages(messageStore: MessageStore) {
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [unreadCounts, setUnreadCounts] = useState<{ byPeer: Record<string, number>; total: number }>({
    byPeer: {},
    total: 0,
  });

  useEffect(() => {
    const updateMessages = () => {
      setMessages(messageStore.getAllMessages());
      setUnreadCounts(messageStore.getUnreadCounts());
    };

    updateMessages();
    return messageStore.subscribe(updateMessages);
  }, [messageStore]);

  const addMessage = (peer: string, message: Message): void => {
    messageStore.addMessage(peer, message);
  };

  const setMessages = (peer: string, messages: Message[]): void => {
    messageStore.setMessages(peer, messages);
  };

  const clearMessages = (peer: string): void => {
    messageStore.clearMessages(peer);
  };

  return {
    messages,
    unreadCounts,
    addMessage,
    setMessages,
    clearMessages,
  };
}