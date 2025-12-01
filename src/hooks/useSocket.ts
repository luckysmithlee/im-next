import { useState, useEffect } from 'react';
import type { ISocketService } from '@/services/chat/SocketService';

export function useSocket(socketService: ISocketService) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<{ byPeer: Record<string, number>; total: number }>({
    byPeer: {},
    total: 0,
  });

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleOnlineUsers = (users: string[]) => {
      setOnlineUsers(users);
    };

    const handleUnreadCounts = (counts: { byPeer: Record<string, number>; total: number }) => {
      setUnreadCounts(counts);
    };

    socketService.onConnect(handleConnect);
    socketService.onDisconnect(handleDisconnect);
    socketService.onOnlineUsers(handleOnlineUsers);
    socketService.onUnreadCounts(handleUnreadCounts);

    return () => {
      // Cleanup is handled by the socket service itself
    };
  }, [socketService]);

  const connect = async (token: string): Promise<void> => {
    await socketService.connect(token);
  };

  const disconnect = (): void => {
    socketService.disconnect();
  };

  return {
    isConnected,
    onlineUsers,
    unreadCounts,
    connect,
    disconnect,
  };
}