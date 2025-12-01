import { useState, useEffect } from 'react';
import type { ChatStore } from '@/stores/chatStore';

export function useChat(chatStore: ChatStore) {
  const [state, setState] = useState(chatStore.getState());

  useEffect(() => {
    return chatStore.subscribe(setState);
  }, [chatStore]);

  return {
    messages: state.messages,
    conversations: state.conversations,
    activePeer: state.activePeer,
    isLoading: state.isLoading,
    error: state.error,
    sendMessage: chatStore.sendMessage.bind(chatStore),
    setActivePeer: chatStore.setActivePeer.bind(chatStore),
    loadMessages: chatStore.loadMessages.bind(chatStore),
    deleteConversation: chatStore.deleteConversation.bind(chatStore),
  };
}