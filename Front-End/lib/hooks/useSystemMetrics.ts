"use client";

import { useState, useEffect } from 'react';
import apiClient from '../api/client';

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  memoryTotal: number;
  memoryFree: number;
  timestamp: number;
}

export const useSystemMetrics = (interval: number = 1000) => {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    memoryTotal: 0,
    memoryFree: 0,
    timestamp: Date.now(),
  });

  useEffect(() => {
    const getSystemMetrics = async () => {
      try {
        // Get memory info
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          setMetrics(prev => ({
            ...prev,
            memoryUsage: memory.usedJSHeapSize,
            memoryTotal: memory.totalJSHeapSize,
            memoryFree: memory.totalJSHeapSize - memory.usedJSHeapSize,
            timestamp: Date.now(),
          }));
        }

        // Get CPU usage from backend
        try {
          const response = await apiClient.get('/api/metrics/cpu');
          const { cpuUsage } = response.data;
          setMetrics(prev => ({
            ...prev,
            cpuUsage,
          }));
        } catch (error) {
          console.error('Error fetching CPU metrics:', error);
          // Fallback to hardware concurrency if available
          if ('hardwareConcurrency' in navigator) {
            const cpuCores = navigator.hardwareConcurrency;
            // Estimate CPU usage based on performance.now() and requestAnimationFrame
            let lastTime = performance.now();
            let lastFrameTime = performance.now();
            let frameCount = 0;
            
            const measureFrame = () => {
              const currentTime = performance.now();
              const frameTime = currentTime - lastFrameTime;
              lastFrameTime = currentTime;
              
              if (frameTime > 0) {
                frameCount++;
                const fps = 1000 / frameTime;
                // Estimate CPU usage based on FPS and available cores
                const estimatedUsage = Math.min(100, (fps / 60) * 100 * (cpuCores / 4));
                
                setMetrics(prev => ({
                  ...prev,
                  cpuUsage: estimatedUsage,
                }));
              }
              
              requestAnimationFrame(measureFrame);
            };
            
            requestAnimationFrame(measureFrame);
          }
        }
      } catch (error) {
        console.error('Error getting system metrics:', error);
      }
    };

    const intervalId = setInterval(getSystemMetrics, interval);
    return () => clearInterval(intervalId);
  }, [interval]);

  return metrics;
}; 
