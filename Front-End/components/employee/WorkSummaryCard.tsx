'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface WorkSummaryProps {
  date: string;
  hours: number;
  minutes: number;
}

export function WorkSummaryCard({ date, hours, minutes }: WorkSummaryProps) {
  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">
          {format(new Date(date), 'EEEE, MMMM d, yyyy')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="text-4xl font-bold">
            {hours}h {minutes}m
          </div>
          <div className="text-sm text-muted-foreground">
            Time in Office
          </div>
          <div className="w-full h-2 bg-muted rounded-full mt-4">
            <div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.min(((hours * 60 + minutes) / 480) * 100, 100)}%`,
              }}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(((hours * 60 + minutes) / 480) * 100)}% of workday
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 