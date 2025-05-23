"use client";

import React from 'react';

interface DateRangeSelectorProps {
  startDate: Date;
  endDate: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
}

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}) => {
  const handlePresetClick = (hours: number) => {
    const end = new Date();
    const start = new Date(end.getTime() - hours * 60 * 60 * 1000);
    onStartDateChange(start);
    onEndDateChange(end);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => handlePresetClick(1)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
          >
            1h
          </button>
          <button
            onClick={() => handlePresetClick(6)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
          >
            6h
          </button>
          <button
            onClick={() => handlePresetClick(24)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
          >
            24h
          </button>
          <button
            onClick={() => handlePresetClick(24 * 7)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
          >
            7d
          </button>
          <button
            onClick={() => handlePresetClick(24 * 30)}
            className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded"
          >
            30d
          </button>
        </div>
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="datetime-local"
              value={startDate.toISOString().slice(0, 16)}
              onChange={(e) => onStartDateChange(new Date(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="datetime-local"
              value={endDate.toISOString().slice(0, 16)}
              onChange={(e) => onEndDateChange(new Date(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}; 
