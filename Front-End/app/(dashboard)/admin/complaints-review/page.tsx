"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ProfileInfo {
  full_name: string;
  email: string;
}

interface Complaint {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: "pending" | "resolved" | "dismissed";
  submitted_at: string;
  profiles: ProfileInfo[] | null;
}

export default function AdminComplaintsReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  const fetchPendingComplaints = async () => {
    if (!user || user.role !== "admin") {
      setComplaints([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const supabase = getSupabaseBrowser();
    try {
      const { data, error } = await supabase
        .from("complaints")
        .select(`
          id, user_id, subject, description, status, submitted_at,
          profiles (full_name, email)
        `)
        .eq("status", "pending")
        .order("submitted_at", { ascending: true });

      if (error) {
        console.error("Error fetching complaints:", error);
        toast({ title: "Error", description: "Failed to load pending complaints.", variant: "destructive" });
        setComplaints([]);
      } else {
        setComplaints(data as Complaint[] || []);
      }
    } catch (e: any) {
      console.error("Unexpected error fetching complaints:", e);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPendingComplaints();
    } else {
      setIsLoading(false);
      setComplaints([]);
    }
  }, [user]);

  const handleUpdateComplaintStatus = async (complaintId: string, newStatus: "resolved" | "dismissed") => {
    if (!user || user.role !== "admin") return;

    setIsProcessing(prev => ({ ...prev, [complaintId]: true }));
    const supabase = getSupabaseBrowser();
    try {
      const { error } = await supabase
        .from("complaints")
        .update({
          status: newStatus,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString()
        })
        .eq("id", complaintId);

      if (error) {
        toast({ title: "Error", description: `Failed to update complaint: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Complaint marked as ${newStatus}.` });
        setComplaints(prevComplaints => prevComplaints.filter(c => c.id !== complaintId));
      }
    } catch (e: any) {
      console.error("Unexpected error updating status:", e);
      toast({ title: "Error", description: "An unexpected error occurred while updating status.", variant: "destructive" });
    } finally {
      setIsProcessing(prev => ({ ...prev, [complaintId]: false }));
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center">Loading pending complaints...</div>;
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
          <CardTitle>Pending Complaints Review</CardTitle>
          <CardDescription>Review and manage employee complaints.</CardDescription>
        </CardHeader>
        <CardContent>
          {complaints.length === 0 ? (
            <p>No pending complaints at this time.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {complaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell>{complaint.profiles?.[0]?.full_name || "N/A"}</TableCell>
                    <TableCell>{complaint.profiles?.[0]?.email || "N/A"}</TableCell>
                    <TableCell>{complaint.subject}</TableCell>
                    <TableCell className="max-w-xs truncate" title={complaint.description}>{complaint.description}</TableCell>
                    <TableCell>{new Date(complaint.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateComplaintStatus(complaint.id, "resolved")}
                        disabled={isProcessing[complaint.id]}
                      >
                        {isProcessing[complaint.id] ? "..." : "Mark Resolved"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleUpdateComplaintStatus(complaint.id, "dismissed")}
                        disabled={isProcessing[complaint.id]}
                      >
                        {isProcessing[complaint.id] ? "..." : "Dismiss"}
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
