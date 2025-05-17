'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Calendar, TrendingUp, Users } from 'lucide-react';

interface WorkSummaryGridProps {
  timeData: {
    today: number;
    week: number;
    month: number;
  };
}

export function WorkSummaryGrid({ timeData }: WorkSummaryGridProps) {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const calculateProgress = (value: number, target: number) => {
    return Math.min((value / target) * 100, 100);
  };

  // Target hours (these could be fetched from settings)
  const dailyTarget = 8 * 60; // 8 hours in minutes
  const weeklyTarget = 40 * 60; // 40 hours in minutes
  const monthlyTarget = 160 * 60; // 160 hours in minutes

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(timeData.today)}</div>
          <Progress
            value={calculateProgress(timeData.today, dailyTarget)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(calculateProgress(timeData.today, dailyTarget))}% of daily target
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(timeData.week)}</div>
          <Progress
            value={calculateProgress(timeData.week, weeklyTarget)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(calculateProgress(timeData.week, weeklyTarget))}% of weekly target
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatTime(timeData.month)}</div>
          <Progress
            value={calculateProgress(timeData.month, monthlyTarget)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            {Math.round(calculateProgress(timeData.month, monthlyTarget))}% of monthly target
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Daily</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTime(Math.round(timeData.month / 20))} {/* Assuming 20 working days */}
          </div>
          <Progress
            value={calculateProgress(timeData.month / 20, dailyTarget)}
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Average per working day
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 