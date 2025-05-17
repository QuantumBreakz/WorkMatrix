"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useToast } from "@/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AdminRequest {
  id: string;
  email: string;
  full_name: string;
  department: string;
  phone: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  approved_by: string | null;
  approved_at: string | null;
}

export default function AdminApprovalsPage() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const supabase = createClientComponentClient();

  useEffect(() => {
    loadAdminRequests();
  }, []);

  const loadAdminRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading admin requests:", error);
      toast({
        title: "Error",
        description: "Failed to load admin requests",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (requestId: string, approved: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (approved) {
        // Get the request details
        const { data: request } = await supabase
          .from("admin_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        if (!request) throw new Error("Request not found");

        // Create the user account
        const { error: signUpError } = await supabase.auth.admin.createUser({
          email: request.email,
          email_confirm: true,
          user_metadata: {
            full_name: request.full_name,
            role: "admin",
            department: request.department,
            phone: request.phone,
          },
        });

        if (signUpError) throw signUpError;

        // Update the request status
        const { error: updateError } = await supabase
          .from("admin_requests")
          .update({
            status: "approved",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Admin request approved successfully",
        });
      } else {
        // Reject the request
        const { error: updateError } = await supabase
          .from("admin_requests")
          .update({
            status: "rejected",
            approved_by: user.id,
            approved_at: new Date().toISOString(),
          })
          .eq("id", requestId);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Admin request rejected",
        });
      }

      // Reload the requests
      loadAdminRequests();
    } catch (error) {
      console.error("Error handling admin request:", error);
      toast({
        title: "Error",
        description: "Failed to process admin request",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "approved":
        return <Badge variant="default">Approved</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Admin Approval Requests</CardTitle>
          <CardDescription>
            Review and approve or reject admin access requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.full_name}</TableCell>
                  <TableCell>{request.email}</TableCell>
                  <TableCell>{request.department || "-"}</TableCell>
                  <TableCell>{request.phone || "-"}</TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell>
                    {format(new Date(request.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApproval(request.id, true)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleApproval(request.id, false)}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No admin requests found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 
