"use client";

import { useCallback, useState, useEffect } from 'react';
import { BackgroundService } from '../services/background-service';
import { ActivityMetrics } from '../services/background-service';

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
}

export const DEFAULT_CONFIG: CaptureConfig = {
  // Timing defaults
  screenshotInterval: 5 * 60 * 1000, // 5 minutes
  maxVideoDuration: 30 * 60 * 1000, // 30 minutes
  idleThreshold: 5 * 60 * 1000, // 5 minutes
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours

  // Storage defaults
  maxStorageSize: 100 * 1024 * 1024, // 100MB
  maxLocalStorageAge: 24 * 60 * 60 * 1000, // 24 hours
  compressionQuality: 0.8,
  maxRetries: 3,

  // Capture defaults
  captureOnIdle: false,
  captureOnBlur: true,
  captureOnFocus: true,
  captureOnVisibilityChange: true,
  captureOnNetworkChange: true,

  // Monitoring defaults
  monitorMouseMovement: true,
  monitorKeyboardActivity: true,
  monitorScrollActivity: true,
  monitorNetworkActivity: true,
  monitorTabVisibility: true,

  // Notification defaults
  notifyOnStorageFull: true,
  notifyOnCaptureError: true,
  notifyOnUploadError: true,
};

export const useBackgroundCapture = () => {
  const service = BackgroundService.getInstance();
  const [isCapturing, setIsCapturing] = useState(false);
  const [metrics, setMetrics] = useState<ActivityMetrics | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMetrics = service.getActivityMetrics();
      setMetrics(currentMetrics);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const startCapture = useCallback(async () => {
    await service.startCapture('user');
    setIsCapturing(true);
  }, []);

  const stopCapture = useCallback(() => {
    service.stopCapture();
    setIsCapturing(false);
  }, []);

  const startVideoCapture = useCallback(async () => {
    await service.startVideoCapture('user');
  }, []);

  const stopVideoCapture = useCallback(() => {
    service.stopVideoCapture();
  }, []);

  const pauseVideoCapture = useCallback(() => {
    service.pauseVideoCapture();
  }, []);

  const resumeVideoCapture = useCallback(() => {
    service.resumeVideoCapture();
  }, []);

  const setConfig = useCallback((newConfig: Partial<CaptureConfig>) => {
    service.setConfig(newConfig);
  }, []);

  const getActivityMetrics = useCallback(() => {
    return service.getActivityMetrics();
  }, []);

  const getNetworkStatus = useCallback(() => {
    return service.getNetworkStatus();
  }, []);

  const getVisibilityState = useCallback(() => {
    return service.getVisibilityState();
  }, []);

  return {
    startCapture,
    stopCapture,
    startVideoCapture,
    stopVideoCapture,
    pauseVideoCapture,
    resumeVideoCapture,
    setConfig,
    getActivityMetrics,
    getNetworkStatus,
    getVisibilityState,
    isCapturing,
    metrics,
  };
}; 
