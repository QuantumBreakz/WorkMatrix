"use client";

import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export type WebSocketMessage = {
  type: string;
  data?: any;
  error?: string;
  timestamp: string;
};

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8765';
const MAX_RETRIES = 5;
const RETRY_INTERVAL = 3000;

export function useWebSocket() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setIsConnected(true);
        setRetryCount(0);
        console.log('WebSocket connected');
      };

      socket.onclose = (event) => {
        setIsConnected(false);
        console.log('WebSocket disconnected', event.code);
        
        if (retryCount < MAX_RETRIES) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            connect();
          }, RETRY_INTERVAL);
        } else {
          console.error('Max reconnection attempts reached');
          toast({
            title: 'Connection Error',
            description: 'Failed to connect to monitoring service. Some features may be limited.',
            variant: 'destructive',
          });
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        socket.close();
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle incoming messages
          console.log('Received:', data);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      setWs(socket);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, RETRY_INTERVAL);
      }
    }
  }, [retryCount, toast]);

  const startMonitoring = useCallback(() => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      connect();
    }
  }, [ws, connect]);

  const stopMonitoring = useCallback(() => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  }, [ws]);

  const getConnectionStatus = useCallback(() => {
    return isConnected;
  }, [isConnected]);

  useEffect(() => {
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [ws]);

  return {
    startMonitoring,
    stopMonitoring,
    getConnectionStatus,
    isConnected
  };
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private userId: string;
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    this.isConnecting = true;
    this.cleanup(); // Clean up any existing connections

    try {
      this.ws = new WebSocket('ws://localhost:8765');

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send authentication message
        this.send({
          type: 'auth',
          user_id: this.userId,
          timestamp: new Date().toISOString()
        });

        // Start ping interval
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event.code, event.reason);
        this.isConnecting = false;
        this.cleanup();
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        // Let onclose handle reconnection
      };
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      this.isConnecting = false;
      this.reconnect();
    }
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
      // Remove all event listeners
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      // Close connection if it's still open
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      this.send({
        type: 'ping',
        timestamp: new Date().toISOString()
      });
    }, 30000); // Send ping every 30 seconds
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnectDelay *= 2; // Exponential backoff
      this.connect();
    }, this.reconnectDelay);
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    }
  }

  startMonitoring() {
    this.connect(); // Ensure connection is established
    this.send({
      type: 'start_monitoring',
      timestamp: new Date().toISOString()
    });
  }

  stopMonitoring() {
    this.send({
      type: 'stop_monitoring',
      timestamp: new Date().toISOString()
    });
  }

  onActivityUpdate(handler: (data: any) => void) {
    this.messageHandlers.set('activity_update', handler);
  }

  onScreenshotUpdate(handler: (data: any) => void) {
    this.messageHandlers.set('screenshot_update', handler);
  }

  getConnectionStatus(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  close() {
    this.cleanup();
  }
} 
