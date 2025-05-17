"use client";

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import html2canvas from 'html2canvas';
import type { Database } from "@/types/supabase";

// Extend Window interface to include electron property
declare global {
  interface Window {
    electron?: {
      onActivityUpdate: (callback: (data: ActivityMetrics) => void) => void
      onScreenshotCapture: (callback: (screenshot: string) => void) => void
      onVideoCapture: (callback: (video: string) => void) => void
      startMonitoring: (config: { userId: string; config: Partial<CaptureConfig> }) => Promise<void>
      stopMonitoring: () => void
    }
  }
}

export interface CaptureConfig {
  // Timing configurations
  screenshotInterval: number;
  maxVideoDuration: number;
  idleThreshold: number;
  cleanupInterval: number;

  // Storage configurations
  maxStorageSize: number;
  maxLocalStorageAge: number;
  compressionQuality: number;
  maxRetries: number;

  // Capture configurations
  captureOnIdle: boolean;
  captureOnBlur: boolean;
  captureOnFocus: boolean;
  captureOnVisibilityChange: boolean;
  captureOnNetworkChange: boolean;

  // Monitoring configurations
  monitorMouseMovement: boolean;
  monitorKeyboardActivity: boolean;
  monitorScrollActivity: boolean;
  monitorNetworkActivity: boolean;
  monitorTabVisibility: boolean;

  // Notification configurations
  notifyOnStorageFull: boolean;
  notifyOnCaptureError: boolean;
  notifyOnUploadError: boolean;
  notifyOnStorageError: boolean;
}

export interface ActivityMetrics {
  mouseMovements: number;
  keyboardEvents: number;
  scrollEvents: number;
  networkRequests: number;
  lastActive: number;
  totalActiveTime: number;
  idleTime: number;
}

const DEFAULT_CONFIG: CaptureConfig = {
  screenshotInterval: 60000, // 1 minute
  maxVideoDuration: 300000, // 5 minutes
  idleThreshold: 300000, // 5 minutes
  cleanupInterval: 3600000, // 1 hour
  maxStorageSize: 500 * 1024 * 1024, // 500MB
  maxLocalStorageAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  compressionQuality: 0.8,
  maxRetries: 3,
  captureOnIdle: true,
  captureOnBlur: true,
  captureOnFocus: true,
  captureOnVisibilityChange: true,
  captureOnNetworkChange: true,
  monitorMouseMovement: true,
  monitorKeyboardActivity: true,
  monitorScrollActivity: true,
  monitorNetworkActivity: true,
  monitorTabVisibility: true,
  notifyOnStorageFull: true,
  notifyOnCaptureError: true,
  notifyOnUploadError: true,
  notifyOnStorageError: true,
};

export class BackgroundService {
  private static instance: BackgroundService;
  private isCapturing: boolean = false;
  private captureInterval: NodeJS.Timeout | null = null;
  private videoStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private config: CaptureConfig = DEFAULT_CONFIG;
  private lastActivity: number = Date.now();
  private isIdle: boolean = false;
  private videoStartTime: number = 0;
  private activityMetrics: ActivityMetrics = {
    mouseMovements: 0,
    keyboardEvents: 0,
    scrollEvents: 0,
    networkRequests: 0,
    lastActive: Date.now(),
    totalActiveTime: 0,
    idleTime: 0,
  };
  private networkStatus: 'online' | 'offline' = 'online';
  private visibilityState: 'visible' | 'hidden' = 'visible';
  private retryCount: number = 0;
  private supabase: SupabaseClient<Database>;
  private currentUserId: string = '';
  private backgroundApp: Window['electron'];
  private wsConnection: WebSocket | null = null;

  private constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );
    this.initializeUserId();
    this.setupActivityMonitoring();
    this.setupNetworkMonitoring();
    this.setupVisibilityMonitoring();
    this.startCleanupInterval();
    this.initializeBackgroundApp();
    this.initializeWebSocket();
  }

  private async initializeUserId() {
    const { data: { session } } = await this.supabase.auth.getSession();
    this.currentUserId = session?.user?.id || '';
  }

  private setupActivityMonitoring() {
    if (typeof window !== 'undefined') {
      // Mouse movement monitoring
      if (this.config.monitorMouseMovement) {
        window.addEventListener('mousemove', () => this.updateActivity());
      }

      // Keyboard activity monitoring
      if (this.config.monitorKeyboardActivity) {
        window.addEventListener('keydown', () => this.updateActivity());
      }

      // Scroll activity monitoring
      if (this.config.monitorScrollActivity) {
        window.addEventListener('scroll', () => this.updateActivity());
      }

      // Tab visibility monitoring
      if (this.config.monitorTabVisibility) {
        document.addEventListener('visibilitychange', () => {
          this.visibilityState = document.hidden ? 'hidden' : 'visible';
          if (this.config.captureOnVisibilityChange) {
          this.updateActivity();
        }
      });
        }
    }
  }

  private setupNetworkMonitoring() {
    if (typeof window !== 'undefined' && this.config.monitorNetworkActivity) {
      window.addEventListener('online', () => {
        this.networkStatus = 'online';
        if (this.config.captureOnNetworkChange) {
          this.updateActivity();
        }
      });

      window.addEventListener('offline', () => {
        this.networkStatus = 'offline';
      });

      // Monitor network requests
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        this.activityMetrics.networkRequests++;
        return originalFetch.apply(window, args);
      };
    }
  }

  private setupVisibilityMonitoring() {
    if (typeof window !== 'undefined' && this.config.monitorTabVisibility) {
      document.addEventListener('visibilitychange', () => {
        this.visibilityState = document.hidden ? 'hidden' : 'visible';
        if (this.config.captureOnVisibilityChange) {
          this.updateActivity();
        }
      });
    }
  }

  private startCleanupInterval() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.cleanupStorage();
      }, this.config.cleanupInterval);
    }
  }

  private updateActivity() {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivity;

    if (timeSinceLastActivity >= this.config.idleThreshold) {
      if (!this.isIdle) {
        this.isIdle = true;
        this.activityMetrics.idleTime += timeSinceLastActivity;
      }
    } else {
      if (this.isIdle) {
        this.isIdle = false;
      }
      this.activityMetrics.totalActiveTime += timeSinceLastActivity;
    }
    
    this.lastActivity = now;
    this.activityMetrics.lastActive = now;

    // Send activity update through WebSocket if connected
    this.sendActivityUpdate();
  }

  private async initializeWebSocket() {
    const maxRetries = 3;
    let retryCount = 0;
    const retryDelay = 5000; // 5 seconds
    const wsUrl = process.env.NEXT_PUBLIC_BACKGROUND_APP_WS_URL || 'ws://localhost:8765';

    const connectWebSocket = async () => {
        try {
            if (this.wsConnection?.readyState === WebSocket.OPEN) {
                return; // Already connected
            }

            this.wsConnection = new WebSocket(wsUrl);

            this.wsConnection.onopen = () => {
                console.log('WebSocket connection established');
                this.sendAuthMessage();
                retryCount = 0; // Reset retry count on successful connection
            };

            this.wsConnection.onclose = async (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                if (!event.wasClean && retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, retryDelay));
                    await connectWebSocket();
                } else if (retryCount >= maxRetries) {
                    console.error('Max retry attempts reached');
                }
            };

            this.wsConnection.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            this.wsConnection.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    switch (data.type) {
                        case 'activityUpdate':
                            this.activityMetrics = {
                                ...this.activityMetrics,
                                ...data.data,
                                lastActive: Date.now()
                            };
                            break;
                        case 'error':
                            console.error('WebSocket error message:', data.error);
                            break;
                        case 'pong':
                            // Handle heartbeat response
                            break;
                        default:
                            console.warn('Unknown message type:', data.type);
                    }
                } catch (error) {
                    console.error('Error handling WebSocket message:', error);
                }
            };

            // Set up heartbeat to keep connection alive
            const heartbeat = setInterval(() => {
                if (this.wsConnection?.readyState === WebSocket.OPEN) {
                    this.wsConnection.send(JSON.stringify({
                        type: 'ping',
                        timestamp: new Date().toISOString()
                    }));
                } else {
                    clearInterval(heartbeat);
                }
            }, 30000); // Send heartbeat every 30 seconds

        } catch (error) {
            console.error('Error initializing WebSocket:', error);
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                await connectWebSocket();
            }
        }
    };

    // Initial connection attempt
    await connectWebSocket();
  }

  private handleBlur() {
    if (this.config.captureOnIdle) {
      this.isIdle = true;
    }
  }

  private checkIdleStatus() {
    this.isIdle = Date.now() - this.lastActivity > this.config.idleThreshold;
  }

  getActivityMetrics(): ActivityMetrics {
    return { ...this.activityMetrics };
  }

  getNetworkStatus(): 'online' | 'offline' {
    return this.networkStatus;
  }

  getVisibilityState(): 'visible' | 'hidden' {
    return this.visibilityState;
  }

  static getInstance(): BackgroundService {
    if (!BackgroundService.instance) {
      BackgroundService.instance = new BackgroundService();
    }
    return BackgroundService.instance;
  }

  setConfig(newConfig: Partial<CaptureConfig>) {
    this.config = { ...this.config, ...newConfig };
    if (this.isCapturing) {
      this.restartCapture();
    }
  }

  private async restartCapture() {
    this.stopCapture();
    if (this.isCapturing) {
      await this.startCapture(this.currentUserId);
    }
  }

  private async initializeBackgroundApp() {
    try {
      // Initialize connection to background app
      if (typeof window !== 'undefined' && window.electron) {
        this.backgroundApp = window.electron;
        
        // Listen for activity updates from background app
        this.backgroundApp.onActivityUpdate((data: ActivityMetrics) => {
          this.activityMetrics = {
            ...this.activityMetrics,
            ...data,
            lastActive: Date.now()
          };
        });

        // Listen for screenshot captures from background app
        this.backgroundApp.onScreenshotCapture(async (screenshot: string) => {
          const timestamp = new Date().toISOString();
          await this.uploadToSupabase(this.currentUserId, screenshot, timestamp, 'screenshot');
        });

        // Listen for video captures from background app
        this.backgroundApp.onVideoCapture(async (video: string) => {
          const timestamp = new Date().toISOString();
          await this.uploadToSupabase(this.currentUserId, video, timestamp, 'video');
        });
      }
    } catch (error) {
      console.error('Error initializing background app:', error);
    }
  }

  async startCapture(userId: string) {
    if (this.isCapturing) return;
    this.currentUserId = userId;

    try {
      // Start background app monitoring
      if (this.backgroundApp) {
        await this.backgroundApp.startMonitoring({
          userId,
          config: {
            screenshotInterval: this.config.screenshotInterval,
            maxVideoDuration: this.config.maxVideoDuration,
            idleThreshold: this.config.idleThreshold,
            captureOnIdle: this.config.captureOnIdle,
            captureOnBlur: this.config.captureOnBlur,
            captureOnFocus: this.config.captureOnFocus,
            captureOnVisibilityChange: this.config.captureOnVisibilityChange,
            monitorMouseMovement: this.config.monitorMouseMovement,
            monitorKeyboardActivity: this.config.monitorKeyboardActivity,
            monitorScrollActivity: this.config.monitorScrollActivity,
            monitorNetworkActivity: this.config.monitorNetworkActivity,
          }
        });
      }

      this.isCapturing = true;
      this.captureInterval = setInterval(async () => {
        try {
          if (!this.config.captureOnIdle && this.isIdle) {
            return;
          }

          // Sync activity metrics with Supabase
          await this.syncActivityMetrics();
        } catch (error) {
          console.error('Capture error:', error);
        }
      }, this.config.screenshotInterval);
    } catch (error) {
      console.error('Error starting capture:', error);
      throw error;
    }
  }

  stopCapture() {
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }

    // Stop background app monitoring
    if (this.backgroundApp) {
      this.backgroundApp.stopMonitoring();
    }

    this.isCapturing = false;
  }

  private async syncActivityMetrics() {
    try {
      const { error } = await this.supabase
        .from('app_usage')
        .upsert({
          user_id: this.currentUserId,
          total_active_time: this.activityMetrics.totalActiveTime,
          total_idle_time: this.activityMetrics.idleTime,
          last_active: new Date().toISOString(),
          mouse_movements: this.activityMetrics.mouseMovements,
          keyboard_events: this.activityMetrics.keyboardEvents,
          scroll_events: this.activityMetrics.scrollEvents,
          network_requests: this.activityMetrics.networkRequests,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error syncing activity metrics:', error);
    }
  }

  private async checkStorageQuota(): Promise<boolean> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const {usage, quota} = await navigator.storage.estimate();
      return (usage || 0) < this.config.maxStorageSize;
    }
    return true; // If storage API not available, assume OK
  }

  private async captureScreenshot(): Promise<string> {
    try {
      const canvas = await html2canvas(document.documentElement, {
        logging: false,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      return canvas.toDataURL('image/jpeg', this.config.compressionQuality);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      throw error;
    }
  }

  private async uploadToSupabase(
    userId: string,
    data: string,
    timestamp: string,
    type: 'screenshot' | 'video'
  ) {
    try {
      // Convert base64 to blob
      const base64Data = data.split(',')[1];
      const blob = this.base64ToBlob(base64Data, type === 'screenshot' ? 'image/jpeg' : 'video/webm');

      const { data: uploadData, error } = await this.supabase
        .storage
        .from('user-captures')
        .upload(`${userId}/${type}/${timestamp}`, blob);

      if (error) {
        if (this.config.notifyOnUploadError) {
          console.error('Upload error:', error);
        }
        if (this.retryCount < this.config.maxRetries) {
          this.retryCount++;
          setTimeout(() => this.uploadToSupabase(userId, data, timestamp, type), 5000);
        }
        throw error;
      }

      this.retryCount = 0;
      // Clean up local storage after successful upload
      const key = `${type}_${userId}_${timestamp}`;
      localStorage.removeItem(key);
    } catch (error) {
      if (this.config.notifyOnUploadError) {
        console.error('Upload error:', error);
      }
    }
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: mimeType });
  }

  async startVideoCapture(userId: string) {
    try {
      this.videoStream = await navigator.mediaDevices.getDisplayMedia({
        video: true
      });

      this.mediaRecorder = new MediaRecorder(this.videoStream, {
        mimeType: 'video/webm'
      });

      this.recordedChunks = [];
      this.videoStartTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const timestamp = new Date().toISOString();
          
          // Save to local storage
          const videoKey = `video_${userId}_${timestamp}`;
          localStorage.setItem(videoKey, base64data);
          
          // Upload to Supabase
          this.uploadToSupabase(userId, base64data, timestamp, 'video');
        };
        
        reader.readAsDataURL(blob);
      };

      // Set up automatic stop after max duration
      setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.stopVideoCapture();
        }
      }, this.config.maxVideoDuration);

      this.mediaRecorder.start(1000); // Collect data every second
    } catch (error) {
      console.error('Video capture error:', error);
    }
  }

  pauseVideoCapture() {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.pause();
    }
  }

  resumeVideoCapture() {
    if (this.mediaRecorder?.state === 'paused') {
      this.mediaRecorder.resume();
    }
  }

  stopVideoCapture() {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }
  }

  async cleanupStorage(): Promise<void> {
    try {
      // Check storage quota
      const hasQuota = await this.checkStorageQuota();
      if (!hasQuota) {
        // Delete oldest records if storage is full
        const cutoffDate = new Date(Date.now() - this.config.maxLocalStorageAge);
        
        // Clean up screenshots
        const screenshots = await this.getStoredScreenshots();
        for (const screenshot of screenshots) {
          if (new Date(screenshot.timestamp) < cutoffDate) {
            await this.deleteScreenshot(screenshot.id);
          }
        }
        
        // Clean up recordings
        const recordings = await this.getStoredRecordings();
        for (const recording of recordings) {
          if (new Date(recording.timestamp) < cutoffDate) {
            await this.deleteRecording(recording.id);
          }
        }
        
        // Clean up activity logs
        const activityLogs = await this.getStoredActivityLogs();
        for (const log of activityLogs) {
          if (new Date(log.timestamp) < cutoffDate) {
            await this.deleteActivityLog(log.id);
          }
        }
      }
    } catch (error) {
      console.error('Error during storage cleanup:', error);
      if (this.config.notifyOnStorageError) {
        this.notify('Storage cleanup failed', 'error');
      }
    }
  }

  private async getStoredScreenshots(): Promise<Array<{ id: string; timestamp: string }>> {
    try {
      const result = await this.supabase
        .from('screenshots')
        .select('id, timestamp')
        .eq('user_id', this.currentUserId)
        .order('timestamp', { ascending: true });
      
      return result.data || [];
    } catch (error) {
      console.error('Error getting stored screenshots:', error);
      return [];
    }
  }

  private async getStoredRecordings(): Promise<Array<{ id: string; timestamp: string }>> {
    try {
      const result = await this.supabase
        .from('recordings')
        .select('id, timestamp')
        .eq('user_id', this.currentUserId)
        .order('timestamp', { ascending: true });
      
      return result.data || [];
    } catch (error) {
      console.error('Error getting stored recordings:', error);
      return [];
    }
  }

  private async getStoredActivityLogs(): Promise<Array<{ id: string; timestamp: string }>> {
    try {
      const result = await this.supabase
        .from('activity_logs')
        .select('id, timestamp')
        .eq('user_id', this.currentUserId)
        .order('timestamp', { ascending: true });
      
      return result.data || [];
    } catch (error) {
      console.error('Error getting stored activity logs:', error);
      return [];
    }
  }

  private async deleteScreenshot(id: string): Promise<void> {
    try {
      // Delete from storage
      await this.supabase.storage
        .from('screenshots')
        .remove([`${this.currentUserId}/${id}.jpg`]);
      
      // Delete from database
      await this.supabase
        .from('screenshots')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error deleting screenshot:', error);
      throw error;
    }
  }

  private async deleteRecording(id: string): Promise<void> {
    try {
      // Delete from storage
      await this.supabase.storage
        .from('recordings')
        .remove([`${this.currentUserId}/${id}.webm`]);
      
      // Delete from database
      await this.supabase
        .from('recordings')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  private async deleteActivityLog(id: string): Promise<void> {
    try {
      await this.supabase
        .from('activity_logs')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Error deleting activity log:', error);
      throw error;
    }
  }

  private notify(message: string, type: 'info' | 'warning' | 'error' = 'info'): void {
    if (typeof window !== 'undefined' && this.config.notifyOnStorageError) {
      switch (type) {
        case 'error':
          console.error(message);
          break;
        case 'warning':
          console.warn(message);
          break;
        default:
          console.log(message);
      }
      
      // You can add a notification system here if needed
      // For example, using toast notifications
    }
  }

  public getCapturingStatus(): boolean {
    return this.isCapturing;
  }

  private sendAuthMessage() {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'auth',
        user_id: this.currentUserId,
        timestamp: new Date().toISOString()
      }));
    }
  }

  private sendActivityUpdate() {
    if (this.wsConnection?.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        type: 'activity_update',
        data: this.activityMetrics,
        timestamp: new Date().toISOString()
      }))
    }
  }
} 
