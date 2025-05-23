"use client";

import React, { useState, useEffect } from 'react';
import { useBackgroundCapture } from '@/lib/hooks/useBackgroundCapture';
import { useSystemMetrics } from '@/lib/hooks/useSystemMetrics';
import { ActivityMetrics } from '@/lib/services/background-service';
import { SystemMetrics } from '@/lib/hooks/useSystemMetrics';
import { downloadMetrics } from '@/lib/utils/exportMetrics';
import { filterMetricsByDateRange, calculateMetricsSummary } from '@/lib/utils/filterMetrics';
import { DateRangeSelector } from './DateRangeSelector';
import { ActivityPieChart } from './ActivityPieChart';
import { MetricsChart } from './MetricsChart';

export const MonitoringDashboard: React.FC = () => {
  const { startCapture, stopCapture, isCapturing, metrics, startVideoCapture, stopVideoCapture } = useBackgroundCapture();
  const systemMetrics = useSystemMetrics();
  const [metricsHistory, setMetricsHistory] = useState<ActivityMetrics[]>([]);
  const [systemMetricsHistory, setSystemMetricsHistory] = useState<SystemMetrics[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  useEffect(() => {
    if (metrics) {
      setMetricsHistory(prev => [...prev, metrics]);
    }
  }, [metrics]);

  useEffect(() => {
    if (systemMetrics) {
      setSystemMetricsHistory(prev => [...prev, systemMetrics]);
    }
  }, [systemMetrics]);

  const handleStartVideo = async () => {
    await startVideoCapture();
    setIsVideoRecording(true);
  };

  const handleStopVideo = () => {
    stopVideoCapture();
    setIsVideoRecording(false);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const filteredMetrics = filterMetricsByDateRange(
      metricsHistory,
      systemMetricsHistory,
      startDate,
      endDate
    );
    await downloadMetrics({
      activityMetrics: filteredMetrics.activityMetrics,
      systemMetrics: filteredMetrics.systemMetrics,
      timestamp: new Date().toISOString(),
      userId: 'user', // Replace with actual user ID
    }, format);
  };

  const filteredMetrics = filterMetricsByDateRange(
    metricsHistory,
    systemMetricsHistory,
    startDate,
    endDate
  );

  const summary = calculateMetricsSummary(filteredMetrics);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Monitoring Dashboard</h1>
        <div className="space-x-4">
          <button
            onClick={() => isCapturing ? stopCapture() : startCapture()}
            className={`px-4 py-2 rounded ${
              isCapturing ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isCapturing ? 'Stop Capture' : 'Start Capture'}
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
          >
            Export JSON
          </button>
        </div>
      </div>

      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Activity Distribution</h2>
          <ActivityPieChart metrics={metrics || { mouseMovements: 0, keyboardEvents: 0, scrollEvents: 0, networkRequests: 0, lastActive: 0, totalActiveTime: 0, idleTime: 0 }} />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Metrics Summary</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>Mouse Movements: {summary.activity.totalMouseMovements}</div>
                <div>Keyboard Events: {summary.activity.totalKeyboardEvents}</div>
                <div>Scroll Events: {summary.activity.totalScrollEvents}</div>
                <div>Network Requests: {summary.activity.totalNetworkRequests}</div>
                <div>Active Time: {Math.round(summary.activity.totalActiveTime / 1000)}s</div>
                <div>Idle Time: {Math.round(summary.activity.totalIdleTime / 1000)}s</div>
              </div>
            </div>
            <div>
              <h3 className="font-medium">System Summary</h3>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>Avg CPU Usage: {summary.system.avgCpuUsage.toFixed(1)}%</div>
                <div>Avg Memory Usage: {summary.system.avgMemoryUsage.toFixed(1)}%</div>
                <div>Max Memory Usage: {summary.system.maxMemoryUsage.toFixed(1)}%</div>
                <div>Min Memory Usage: {summary.system.minMemoryUsage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Activity Metrics</h2>
          <MetricsChart
            data={filteredMetrics.activityMetrics}
            type="activity"
          />
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">System Metrics</h2>
          <MetricsChart
            data={filteredMetrics.systemMetrics}
            type="system"
          />
        </div>
      </div>

      {/* Control Panel */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Capture Controls</h3>
        <div className="flex gap-4">
          <button
            onClick={isVideoRecording ? handleStopVideo : handleStartVideo}
            className={`px-4 py-2 rounded ${
              isVideoRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
            } text-white`}
          >
            {isVideoRecording ? 'Stop Video' : 'Start Video'}
          </button>
        </div>
      </div>
    </div>
  );
}; 
