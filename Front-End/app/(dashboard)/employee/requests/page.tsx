'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RequestForm } from '@/components/employee/RequestForm';

interface Request {
  id: string;
  ticket_id: string;
  request_type: 'leave' | 'compensation';
  status: 'pending' | 'approved' | 'rejected';
  start_date: string;
  end_date: string;
  reason: string;
  leave_type?: string;
  compensation_hours?: number;
  created_at: string;
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Request['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="leave" className="space-y-8">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="leave">Leave Request</TabsTrigger>
          <TabsTrigger value="compensation">Time Compensation</TabsTrigger>
        </TabsList>

        <TabsContent value="leave">
          <div className="grid gap-8 md:grid-cols-2">
            <RequestForm type="leave" />
            <Card>
              <CardHeader>
                <CardTitle>Recent Leave Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading requests...</p>
                  ) : requests.filter(r => r.request_type === 'leave').length === 0 ? (
                    <p>No leave requests found</p>
                  ) : (
                    requests
                      .filter(r => r.request_type === 'leave')
                      .map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">Ticket ID: {request.ticket_id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm mb-2">
                            {request.leave_type} Leave
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.start_date).toLocaleDateString()} -{' '}
                            {new Date(request.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compensation">
          <div className="grid gap-8 md:grid-cols-2">
            <RequestForm type="compensation" />
            <Card>
              <CardHeader>
                <CardTitle>Recent Compensation Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p>Loading requests...</p>
                  ) : requests.filter(r => r.request_type === 'compensation').length === 0 ? (
                    <p>No compensation requests found</p>
                  ) : (
                    requests
                      .filter(r => r.request_type === 'compensation')
                      .map((request) => (
                        <div
                          key={request.id}
                          className="p-4 rounded-lg border"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium">Ticket ID: {request.ticket_id}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm mb-2">
                            {request.compensation_hours} hours
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.start_date).toLocaleDateString()} -{' '}
                            {new Date(request.end_date).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 