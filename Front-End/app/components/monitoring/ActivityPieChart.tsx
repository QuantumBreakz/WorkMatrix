"use client";

import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { ActivityMetrics } from '@/lib/services/background-service';

ChartJS.register(ArcElement, Tooltip, Legend);

interface ActivityPieChartProps {
  metrics: ActivityMetrics;
}

export const ActivityPieChart: React.FC<ActivityPieChartProps> = ({ metrics }) => {
  const data = {
    labels: ['Mouse Movements', 'Keyboard Events', 'Scroll Events', 'Network Requests'],
    datasets: [
      {
        data: [
          metrics.mouseMovements,
          metrics.keyboardEvents,
          metrics.scrollEvents,
          metrics.networkRequests,
        ],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
      },
      title: {
        display: true,
        text: 'Activity Distribution',
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="h-64">
      <Pie data={data} options={options} />
    </div>
  );
}; 
