'use client';

import { Card, CardContent } from "@/components/ui/card"
import { Clock, Calendar, BarChart2 } from "lucide-react"

interface WorkSummaryGridProps {
  timeData: {
    today: number
    week: number
    month: number
  }
}

function formatTime(minutes: number) {
  if (isNaN(minutes) || minutes === null) return "0h 0m"
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return `${hours}h ${mins}m`
}

export function WorkSummaryGrid({ timeData }: WorkSummaryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <Clock className="h-8 w-8 text-blue-400 mb-2" />
          <h3 className="text-lg font-medium mb-1">Today</h3>
          <p className="text-2xl font-bold text-blue-400">{formatTime(timeData.today)}</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <Calendar className="h-8 w-8 text-green-400 mb-2" />
          <h3 className="text-lg font-medium mb-1">This Week</h3>
          <p className="text-2xl font-bold text-green-400">{formatTime(timeData.week)}</p>
        </CardContent>
      </Card>

      <Card className="bg-gray-800/50 backdrop-blur-sm border border-gray-700">
        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
          <BarChart2 className="h-8 w-8 text-purple-400 mb-2" />
          <h3 className="text-lg font-medium mb-1">This Month</h3>
          <p className="text-2xl font-bold text-purple-400">{formatTime(timeData.month)}</p>
        </CardContent>
      </Card>
    </div>
  )
} 