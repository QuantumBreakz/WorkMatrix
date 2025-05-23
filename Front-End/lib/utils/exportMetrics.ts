import { ActivityMetrics } from '../services/background-service';
import { SystemMetrics } from '../hooks/useSystemMetrics';

interface ExportData {
  activityMetrics: ActivityMetrics[];
  systemMetrics: SystemMetrics[];
  timestamp: string;
  userId: string;
}

export const exportMetricsToCSV = (data: ExportData): string => {
  const headers = [
    'Timestamp',
    'Mouse Movements',
    'Keyboard Events',
    'Scroll Events',
    'Network Requests',
    'Total Active Time',
    'Idle Time',
    'CPU Usage',
    'Memory Usage',
    'Memory Total',
    'Memory Free',
  ].join(',');

  const rows = data.activityMetrics.map((activity, index) => {
    const system = data.systemMetrics[index] || {
      cpuUsage: 0,
      memoryUsage: 0,
      memoryTotal: 0,
      memoryFree: 0,
      timestamp: 0,
    };

    return [
      new Date(activity.lastActive).toISOString(),
      activity.mouseMovements,
      activity.keyboardEvents,
      activity.scrollEvents,
      activity.networkRequests,
      activity.totalActiveTime,
      activity.idleTime,
      system.cpuUsage,
      system.memoryUsage,
      system.memoryTotal,
      system.memoryFree,
    ].join(',');
  });

  return [headers, ...rows].join('\n');
};

export const exportMetricsToJSON = (data: ExportData): string => {
  return JSON.stringify(data, null, 2);
};

export const downloadMetrics = (
  data: ExportData,
  format: 'csv' | 'json' = 'csv'
) => {
  const content = format === 'csv' 
    ? exportMetricsToCSV(data)
    : exportMetricsToJSON(data);
  
  const blob = new Blob([content], {
    type: format === 'csv' ? 'text/csv' : 'application/json',
  });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `metrics_export_${new Date().toISOString()}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}; 
