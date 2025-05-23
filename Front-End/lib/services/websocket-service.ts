"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765';
const INITIAL_RETRY_INTERVAL = 1000;
const MAX_RETRY_INTERVAL = 30000;
const MAX_RETRIES = 5;
const PING_INTERVAL = 30000;
const PING_TIMEOUT = 5000;

export type WebSocketMessage = {
  type: string;
  data?: any;
  timestamp?: string;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

// Global state for WebSocket instance
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private retryCount = 0;
  private retryInterval = INITIAL_RETRY_INTERVAL;
  private pingInterval: NodeJS.Timeout | null = null;
  private pingTimeout: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private userId: string | null = null;
  private lastPong: number = Date.now();
  private isIntentionalClose: boolean = false;

  private constructor() {
    // Add visibility change listener for better connection management
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', this.handleVisibilityChange);
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Reconnect if disconnected when tab becomes visible
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.reconnect();
      }
    }
  };

  private handleOnline = () => {
    // Attempt to reconnect when network is restored
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.reconnect();
    }
  };

  private handleOffline = () => {
    // Notify status change when network is lost
    this.notifyStatusChange('disconnected');
  };

  private reconnect = () => {
    if (this.userId && !this.isIntentionalClose) {
      this.cleanup();
      this.connect(this.userId).catch(() => {
        // Error handling is done in connect()
      });
    }
  };

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  private cleanup() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private notifyStatusChange(status: ConnectionStatus) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  private handleMessage(message: WebSocketMessage) {
    if (message.type === 'pong') {
      this.lastPong = Date.now();
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
      }
      return;
    }
    this.messageHandlers.forEach(handler => handler(message));
  }

  private setupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // Send ping
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));

        // Set timeout for pong response
        if (this.pingTimeout) {
          clearTimeout(this.pingTimeout);
        }
        this.pingTimeout = setTimeout(() => {
          if (Date.now() - this.lastPong > PING_TIMEOUT) {
            console.warn('Ping timeout - reconnecting...');
            this.reconnect();
          }
        }, PING_TIMEOUT);
      }
    }, PING_INTERVAL);
  }

  async connect(userId: string): Promise<WebSocket> {
    if (this.userId !== userId) {
      this.cleanup();
      this.userId = userId;
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.notifyStatusChange('connecting');
    this.isIntentionalClose = false;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.cleanup();
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          if (!this.ws) return;
          
          this.retryCount = 0;
          this.retryInterval = INITIAL_RETRY_INTERVAL;
          this.lastPong = Date.now();
          this.notifyStatusChange('connected');
          this.setupPing();

          // Send auth message
          this.ws.send(JSON.stringify({
            type: 'auth',
            data: { 
              userId: this.userId,
              timestamp: new Date().toISOString()
            }
          }));

          this.connectionPromise = null;
          resolve(this.ws);
        };

        this.ws.onclose = (event) => {
          this.notifyStatusChange(this.isIntentionalClose ? 'disconnected' : 'reconnecting');
          this.cleanup();
          
          if (!this.isIntentionalClose && this.retryCount < MAX_RETRIES) {
            const nextRetry = Math.min(this.retryInterval * 2, MAX_RETRY_INTERVAL);
            this.retryInterval = nextRetry;
            this.retryCount++;
            
            this.reconnectTimeout = setTimeout(() => {
              this.connect(this.userId!);
            }, nextRetry);
          }
          this.connectionPromise = null;
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.connectionPromise = null;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  disconnect() {
    this.isIntentionalClose = true;
    this.cleanup();
    this.notifyStatusChange('disconnected');
  }

  addMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.delete(handler);
  }

  addStatusHandler(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.add(handler);
    // Immediately notify of current status
    if (this.ws) {
      handler(this.ws.readyState === WebSocket.OPEN ? 'connected' : 'disconnected');
    } else {
      handler('disconnected');
    }
  }

  removeStatusHandler(handler: (status: ConnectionStatus) => void) {
    this.statusHandlers.delete(handler);
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString()
      };
      this.ws.send(JSON.stringify(messageWithTimestamp));
      return true;
    }
    return false;
  }

  startMonitoring(): boolean {
    return this.send({ type: 'start_monitoring' });
  }

  stopMonitoring(): boolean {
    return this.send({ type: 'stop_monitoring' });
  }

  getConnectionStatus(): ConnectionStatus {
    if (!this.ws) return 'disconnected';
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'reconnecting';
      default:
        return 'disconnected';
    }
  }
}

// Hook for using WebSocket
export function useWebSocket() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const wsManager = useRef<WebSocketManager>(WebSocketManager.getInstance());

  useEffect(() => {
    if (!user?.id) return;

    const statusHandler = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        toast({
          title: 'Connection Lost',
          description: 'Lost connection to monitoring service. Attempting to reconnect...',
          variant: 'destructive',
        });
      } else if (status === 'connected') {
        toast({
          title: 'Connected',
          description: 'Successfully connected to monitoring service.',
          variant: 'default',
        });
      }
    };

    const messageHandler = (message: WebSocketMessage) => {
      if (message.type === 'error') {
        toast({
          title: 'Connection Error',
          description: message.data?.message || 'An error occurred with the monitoring service.',
          variant: 'destructive',
        });
      }
    };

    wsManager.current.addStatusHandler(statusHandler);
    wsManager.current.addMessageHandler(messageHandler);
    wsManager.current.connect(user.id).catch(() => {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to monitoring service. Some features may be limited.',
        variant: 'destructive',
      });
    });

    return () => {
      wsManager.current.removeStatusHandler(statusHandler);
      wsManager.current.removeMessageHandler(messageHandler);
      wsManager.current.disconnect();
    };
  }, [user?.id, toast]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isConnecting: connectionStatus === 'connecting',
    isReconnecting: connectionStatus === 'reconnecting',
    sendMessage: useCallback((message: WebSocketMessage) => wsManager.current.send(message), []),
    getConnectionStatus: useCallback(() => wsManager.current.getConnectionStatus(), []),
    startMonitoring: useCallback(() => wsManager.current.startMonitoring(), []),
    stopMonitoring: useCallback(() => wsManager.current.stopMonitoring(), []),
    disconnect: useCallback(() => wsManager.current.disconnect(), [])
  };
} 
