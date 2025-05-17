import { ActivityMetrics } from '../services/background-service';
import { SystemMetrics } from '../hooks/useSystemMetrics';

export interface FilteredMetrics {
  activityMetrics: ActivityMetrics[];
  systemMetrics: SystemMetrics[];
}

export const filterMetricsByDateRange = (
  activityMetrics: ActivityMetrics[],
  systemMetrics: SystemMetrics[],
  startDate: Date,
  endDate: Date
): FilteredMetrics => {
  const filteredActivity = activityMetrics.filter(metric => {
    const timestamp = metric.lastActive;
    return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
  });

  const filteredSystem = systemMetrics.filter(metric => {
    const timestamp = metric.timestamp;
    return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
  });

  return {
    activityMetrics: filteredActivity,
    systemMetrics: filteredSystem,
  };
};

export const calculateMetricsSummary = (metrics: FilteredMetrics) => {
  const { activityMetrics, systemMetrics } = metrics;

  const activitySummary = {
    totalMouseMovements: activityMetrics.reduce((sum, m) => sum + m.mouseMovements, 0),
    totalKeyboardEvents: activityMetrics.reduce((sum, m) => sum + m.keyboardEvents, 0),
    totalScrollEvents: activityMetrics.reduce((sum, m) => sum + m.scrollEvents, 0),
    totalNetworkRequests: activityMetrics.reduce((sum, m) => sum + m.networkRequests, 0),
    totalActiveTime: activityMetrics.reduce((sum, m) => sum + m.totalActiveTime, 0),
    totalIdleTime: activityMetrics.reduce((sum, m) => sum + m.idleTime, 0),
  };

  const systemSummary = {
    avgCpuUsage: systemMetrics.reduce((sum, m) => sum + m.cpuUsage, 0) / systemMetrics.length,
    avgMemoryUsage: systemMetrics.reduce((sum, m) => sum + m.memoryUsage, 0) / systemMetrics.length,
    maxMemoryUsage: Math.max(...systemMetrics.map(m => m.memoryUsage)),
    minMemoryUsage: Math.min(...systemMetrics.map(m => m.memoryUsage)),
  };

  return {
    activity: activitySummary,
    system: systemSummary,
  };
}; 