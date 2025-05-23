"use client";

import { create } from 'zustand';
import { useWebSocket, ConnectionStatus } from '@/lib/services/websocket-service';
import { useCallback, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

interface ConnectionState {
  status: ConnectionStatus;
  lastError: string | null;
  retryCount: number;
  setStatus: (status: ConnectionStatus) => void;
  setError: (error: string | null) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
}

const useConnectionStore = create<ConnectionState>((set) => ({
  status: 'disconnected',
  lastError: null,
  retryCount: 0,
  setStatus: (status) => set({ status }),
  setError: (error) => set({ lastError: error }),
  incrementRetryCount: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetryCount: () => set({ retryCount: 0 }),
}));

export function useConnectionManager() {
  const { toast } = useToast();
  const {
    status,
    lastError,
    retryCount,
    setStatus,
    setError,
    incrementRetryCount,
    resetRetryCount,
  } = useConnectionStore();

  const {
    connectionStatus,
    isConnected,
    isConnecting,
    isReconnecting,
    disconnect,
    sendMessage,
  } = useWebSocket();

  // Handle connection status changes
  useEffect(() => {
    setStatus(connectionStatus);

    switch (connectionStatus) {
      case 'connected':
        resetRetryCount();
        setError(null);
        toast({
          title: 'Connected',
          description: 'Successfully connected to monitoring service.',
          variant: 'default',
        });
        break;

      case 'disconnected':
        if (retryCount > 0) {
          toast({
            title: 'Connection Lost',
            description: 'Lost connection to monitoring service. Attempting to reconnect...',
            variant: 'destructive',
          });
        }
        break;

      case 'reconnecting':
        incrementRetryCount();
        toast({
          title: 'Reconnecting',
          description: `Attempting to reconnect (${retryCount + 1}/5)...`,
          variant: 'default',
        });
        break;

      case 'connecting':
        toast({
          title: 'Connecting',
          description: 'Establishing connection to monitoring service...',
          variant: 'default',
        });
        break;
    }
  }, [connectionStatus, retryCount, toast, setStatus, setError, resetRetryCount, incrementRetryCount]);

  // Handle intentional disconnection
  const handleDisconnect = useCallback(() => {
    disconnect();
    resetRetryCount();
    setError(null);
    toast({
      title: 'Disconnected',
      description: 'Successfully disconnected from monitoring service.',
      variant: 'default',
    });
  }, [disconnect, resetRetryCount, setError, toast]);

  // Handle reconnection
  const handleReconnect = useCallback(() => {
    resetRetryCount();
    setError(null);
    // The WebSocket service will handle the actual reconnection
  }, [resetRetryCount, setError]);

  return {
    status,
    isConnected,
    isConnecting,
    isReconnecting,
    lastError,
    retryCount,
    sendMessage,
    disconnect: handleDisconnect,
    reconnect: handleReconnect,
  };
} 