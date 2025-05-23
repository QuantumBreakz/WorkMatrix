"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks";
import { getSupabaseBrowser } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input"; // For effective date
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // For status update

interface ProfileInfo {
  full_name: string;
  email: string;
}

interface ResignationRequest {
  id: string;
  user_id: string;
  reason: string;
  status: "pending_review" | "processed" | "cancelled";
  submitted_at: string;
  effective_date: string | null; // Date string
  profiles: ProfileInfo[] | null;
}

export default function AdminResignationsReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resignations, setResignations] = useState<ResignationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});
  const [editingRequest, setEditingRequest] = useState<ResignationRequest | null>(null);
  const [effectiveDate, setEffectiveDate] = useState<string>("");

  const fetchPendingResignations = async () => {
    if (!user || user.role !== "admin") {
      setResignations([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const supabase = getSupabaseBrowser();
    try {
      const { data, error } = await supabase
        .from("resignations")
        .select(`
          id, user_id, reason, status, submitted_at, effective_date,
          profiles (full_name, email)
        `)
        .eq("status", "pending_review")
        .order("submitted_at", { ascending: true });

      if (error) {
        console.error("Error fetching resignation requests:", error);
        toast({ title: "Error", description: "Failed to load pending resignation requests.", variant: "destructive" });
        setResignations([]);
      } else {
        setResignations(data as ResignationRequest[] || []);
      }
    } catch (e: any) {
      console.error("Unexpected error fetching resignations:", e);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchPendingResignations();
    } else {
      setIsLoading(false);
      setResignations([]);
    }
  }, [user]);

  const handleOpenEditModal = (request: ResignationRequest) => {
    setEditingRequest(request);
    setEffectiveDate(request.effective_date || new Date().toISOString().split('T')[0]);
  };

  const handleCloseEditModal = () => {
    setEditingRequest(null);
    setEffectiveDate("");
  };

  const handleUpdateResignationStatus = async (newStatus: "processed" | "cancelled") => {
    if (!user || user.role !== "admin" || !editingRequest) return;

    setIsProcessing(prev => ({ ...prev, [editingRequest.id]: true }));
    const supabase = getSupabaseBrowser();
    
    let updateData: any = {
      status: newStatus,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };

    if (newStatus === "processed") {
      if (!effectiveDate) {
        toast({ title: "Error", description: "Effective date is required to process a resignation.", variant: "destructive" });
        setIsProcessing(prev => ({ ...prev, [editingRequest.id]: false }));
        return;
      }
      updateData.effective_date = effectiveDate;
    }

    try {
      const { error } = await supabase
        .from("resignations")
        .update(updateData)
        .eq("id", editingRequest.id);

      if (error) {
        toast({ title: "Error", description: `Failed to update resignation: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: `Resignation request ${newStatus}.` });
        setResignations(prev => prev.filter(r => r.id !== editingRequest.id));
        handleCloseEditModal();
      }
    } catch (e: any) {
      console.error("Unexpected error updating status:", e);
      toast({ title: "Error", description: "An unexpected error occurred while updating status.", variant: "destructive" });
    } finally {
      setIsProcessing(prev => ({ ...prev, [editingRequest.id]: false }));
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6 text-center">Loading pending resignation requests...</div>;
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
          <CardTitle>Pending Resignation Reviews</CardTitle>
          <CardDescription>Review and process employee resignation requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {resignations.length === 0 ? (
            <p>No pending resignation requests at this time.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resignations.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>{request.profiles?.[0]?.full_name || "N/A"}</TableCell>
                    <TableCell>{request.profiles?.[0]?.email || "N/A"}</TableCell>
                    <TableCell className="max-w-xs truncate" title={request.reason}>{request.reason}</TableCell>
                    <TableCell>{new Date(request.submitted_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenEditModal(request)}
                        disabled={isProcessing[request.id]}
                      >
                        {isProcessing[request.id] ? "..." : "Review"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Review Resignation</CardTitle>
              <CardDescription>
                Processing for: {editingRequest.profiles?.[0]?.full_name || "N/A"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Reason Provided:</p>
                <p className="text-sm text-muted-foreground p-2 border rounded-md bg-slate-50">{editingRequest.reason}</p>
              </div>
              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Set Effective Date (Required for Processing)
                </label>
                <Input 
                  type="date" 
                  id="effectiveDate" 
                  value={effectiveDate} 
                  onChange={(e) => setEffectiveDate(e.target.value)} 
                  className="mt-1 block w-full"
                  min={new Date().toISOString().split('T')[0]} // Optional: prevent past dates
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleCloseEditModal} disabled={isProcessing[editingRequest.id]}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleUpdateResignationStatus("cancelled")}
                  disabled={isProcessing[editingRequest.id]}
                >
                  {isProcessing[editingRequest.id] ? "..." : "Mark as Cancelled"}
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => handleUpdateResignationStatus("processed")}
                  disabled={isProcessing[editingRequest.id] || !effectiveDate}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isProcessing[editingRequest.id] ? "..." : "Mark as Processed"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 
