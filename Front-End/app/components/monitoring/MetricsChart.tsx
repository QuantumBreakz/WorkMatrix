"use client";

import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { ActivityMetrics } from '@/lib/services/background-service';
import { SystemMetrics } from '@/lib/hooks/useSystemMetrics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface MetricsChartProps {
  data: ActivityMetrics[] | SystemMetrics[];
  type: 'activity' | 'system';
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ data, type }) => {
  const chartData = {
    labels: data.map((_, index) => index + 1),
    datasets: type === 'activity' 
      ? [
          {
            label: 'Mouse Movements',
            data: (data as ActivityMetrics[]).map(m => m.mouseMovements),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
          },
          {
            label: 'Keyboard Events',
            data: (data as ActivityMetrics[]).map(m => m.keyboardEvents),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
          },
          {
            label: 'Scroll Events',
            data: (data as ActivityMetrics[]).map(m => m.scrollEvents),
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)',
          },
          {
            label: 'Network Requests',
            data: (data as ActivityMetrics[]).map(m => m.networkRequests),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
          },
        ]
      : [
          {
            label: 'CPU Usage',
            data: (data as SystemMetrics[]).map(m => m.cpuUsage),
            borderColor: 'rgba(153, 102, 255, 1)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
          },
          {
            label: 'Memory Usage',
            data: (data as SystemMetrics[]).map(m => m.memoryUsage),
            borderColor: 'rgba(255, 159, 64, 1)',
            backgroundColor: 'rgba(255, 159, 64, 0.2)',
          },
        ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: type === 'activity' ? 'Activity Metrics Over Time' : 'System Metrics Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}; 
