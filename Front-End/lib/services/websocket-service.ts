import { create } from 'zustand';

interface WebSocketState {
  isConnected: boolean;
  activityData: any;
  screenshotData: any;
  status: string;
  connect: (userId: string) => void;
  disconnect: () => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 5000; // 5 seconds

  constructor() {
    // Initialize WebSocket connection when service is created
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleError = this.handleError.bind(this);
    this.handleClose = this.handleClose.bind(this);
  }

  connect(userId: string) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.ws = new WebSocket('ws://localhost:8765');

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      useWebSocketStore.getState().isConnected = true;
      
      // Send authentication message
      this.ws?.send(JSON.stringify({
        type: 'auth',
        user_id: userId
      }));
    };

    this.ws.onmessage = this.handleMessage;
    this.ws.onerror = this.handleError;
    this.ws.onclose = this.handleClose;
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.userId = null;
      useWebSocketStore.getState().isConnected = false;
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'activity_update':
          useWebSocketStore.getState().activityData = data.data;
          break;
        case 'screenshot_update':
          useWebSocketStore.getState().screenshotData = data.data;
          break;
        case 'status_update':
          useWebSocketStore.getState().status = data.status;
          break;
        case 'connection_status':
          useWebSocketStore.getState().isConnected = data.status === 'connected';
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
    useWebSocketStore.getState().isConnected = false;
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket closed:', event.code, event.reason);
    useWebSocketStore.getState().isConnected = false;

    // Attempt to reconnect if not explicitly disconnected
    if (this.userId && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(this.userId!), this.reconnectTimeout);
    }
  }

  // Send ping to keep connection alive
  startPing() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }
}

// Create WebSocket service instance
const websocketService = new WebSocketService();

// Create Zustand store for WebSocket state
export const useWebSocketStore = create<WebSocketState>((set) => ({
  isConnected: false,
  activityData: null,
  screenshotData: null,
  status: '',
  connect: (userId: string) => {
    websocketService.connect(userId);
    // Start ping interval
    setInterval(() => websocketService.startPing(), 30000); // Ping every 30 seconds
  },
  disconnect: () => websocketService.disconnect(),
}));

export default websocketService; 
