"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
const INITIAL_RETRY_INTERVAL = 1000;
const MAX_RETRY_INTERVAL = 30000;
const MAX_RETRIES = 5;

export type WebSocketMessage = {
  type: string;
  data?: any;
};

// Global state for WebSocket instance
class WebSocketManager {
  private static instance: WebSocketManager;
  private ws: WebSocket | null = null;
  private connectionPromise: Promise<WebSocket> | null = null;
  private retryCount = 0;
  private retryInterval = INITIAL_RETRY_INTERVAL;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();
  private statusHandlers: Set<(status: boolean) => void> = new Set();
  private userId: string | null = null;

  private constructor() {}

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

  private notifyStatusChange(status: boolean) {
    this.statusHandlers.forEach(handler => handler(status));
  }

  private handleMessage(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => handler(message));
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

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.cleanup();
        this.ws = new WebSocket(WS_URL);

        this.ws.onopen = () => {
          if (!this.ws) return;
          
          this.retryCount = 0;
          this.retryInterval = INITIAL_RETRY_INTERVAL;
          this.notifyStatusChange(true);

          // Setup ping interval
          this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
              this.ws.send(JSON.stringify({ type: 'ping' }));
            }
          }, 30000);

          // Send auth message
          this.ws.send(JSON.stringify({
            type: 'auth',
            data: { userId: this.userId }
          }));

          this.connectionPromise = null;
          resolve(this.ws);
        };

        this.ws.onclose = () => {
          this.notifyStatusChange(false);
          this.cleanup();
          
          if (this.retryCount < MAX_RETRIES) {
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
          this.connectionPromise = null;
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'pong') return;
            this.handleMessage(message);
          } catch (error) {
            // Silently handle parse errors
          }
        };
      } catch (error) {
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  addMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.add(handler);
  }

  removeMessageHandler(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.delete(handler);
  }

  addStatusHandler(handler: (status: boolean) => void) {
    this.statusHandlers.add(handler);
    // Immediately notify of current status
    if (this.ws) {
      handler(this.ws.readyState === WebSocket.OPEN);
    } else {
      handler(false);
    }
  }

  removeStatusHandler(handler: (status: boolean) => void) {
    this.statusHandlers.delete(handler);
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
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

  getConnectionStatus(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Hook for using WebSocket
export function useWebSocket() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const wsManager = useRef<WebSocketManager>(WebSocketManager.getInstance());

  useEffect(() => {
    if (!user?.id) return;

    const statusHandler = (status: boolean) => setIsConnected(status);
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
    };
  }, [user?.id, toast]);

  return {
    isConnected,
    sendMessage: useCallback((message: WebSocketMessage) => wsManager.current.send(message), []),
    getConnectionStatus: useCallback(() => wsManager.current.getConnectionStatus(), []),
    startMonitoring: useCallback(() => wsManager.current.startMonitoring(), []),
    stopMonitoring: useCallback(() => wsManager.current.stopMonitoring(), [])
  };
} 
