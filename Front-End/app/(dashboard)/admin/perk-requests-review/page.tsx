"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // For displaying status, if needed
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProfileInfo {
  full_name: string;
  email: string;
}

interface PerkRequest {
  id: string;
  user_id: string;
  perk_name: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  submitted_at: string;
  profiles: ProfileInfo[] | null; // Assuming profiles might be an array from the join
}

export default function AdminPerkRequestsReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [perkRequests, setPerkRequests] = useState<PerkRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  const fetchPendingPerkRequests = async () => {
    if (!user || user.role !== "admin") {
      setPerkRequests([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const supabase = getSupabaseBrowser();
    try {
      const { data, error } = await supabase
        .from("perk_requests")
        .select(`
          id, user_id, perk_name, reason, status, submitted_at,
          profiles (full_name, email)
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) {
        console.error("Error fetching perk requests:", error);
        toast({ title: "Error", description: "Failed to load pending perk requests.", variant: "destructive" });
        setPerkRequests([]);
      } else {
        setPerkRequests(data as PerkRequest[] || []);
      }
    } catch (e: any) {
      console.error("Unexpected error fetching perk requests:", e);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPendingPerkRequests();
    } else {
      setIsLoading(false);
      setPerkRequests([]);
    }
  }, [user]);

  const handleUpdatePerkRequestStatus = async (requestId: string, newStatus: "approved" | "rejected") => {
    if (!user || user.role !== "admin") return;

    setIsProcessing(prev => ({ ...prev, [requestId]: true }));
    const supabase = getSupabaseBrowser();
    try {
      const { error } = await supabase
        .from("perk_requests")
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", requestId);

      if (error) {
        toast({ title: "Error", description: `Failed to update perk request: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Perk request ${newStatus}.` });
        setPerkRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
      }
    } catch (e: any) {
      console.error("Unexpected error updating status:", e);
      toast({ title: "Error", description: "An unexpected error occurred while updating status.", variant: "destructive" });
    } finally {
      setIsProcessing(prev => ({ ...prev, [requestId]: false }));
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center">Loading pending perk requests...</div>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader><CardTitle>Access Denied</CardTitle></CardHeader>
          <CardContent><p>You do not have permission to view this page.</p></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Perk Requests Review</CardTitle>
          <CardDescription>Review and approve or reject employee perk requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {perkRequests.length === 0 ? (
            <p>No pending perk requests at this time.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perk Name</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {perkRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.profiles?.[0]?.full_name || "N/A"}</TableCell>
                    <TableCell>{request.profiles?.[0]?.email || "N/A"}</TableCell>
                    <TableCell>{request.perk_name}</TableCell>
                    <TableCell className="max-w-xs truncate" title={request.reason}>{request.reason}</TableCell>
                    <TableCell>{new Date(request.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdatePerkRequestStatus(request.id, "approved")}
                        disabled={isProcessing[request.id]}
                      >
                        {isProcessing[request.id] ? "..." : "Approve"}
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleUpdatePerkRequestStatus(request.id, "rejected")}
                        disabled={isProcessing[request.id]}
                      >
                        {isProcessing[request.id] ? "..." : "Reject"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
