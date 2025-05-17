"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // If needed for subject or category
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks";
import { getSupabaseBrowser } from "@/lib/supabase"; // Import Supabase client

export default function EmployeeComplaintsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [complaintCategory, setComplaintCategory] = useState("");
  const [complaintDetails, setComplaintDetails] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a complaint.", variant: "destructive" });
      return;
    }
    if (!complaintCategory || !complaintDetails.trim()) {
      toast({
        title: "Error",
        description: "Please select a category and provide details for your complaint.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseBrowser();

    try {
      const { error } = await supabase.from("complaints").insert({
        user_id: user.id,
        category: complaintCategory,
        details: complaintDetails,
        status: "submitted", // Or "pending_review", "pending"
        // submitted_at will be set by default value in database (e.g., now())
      });

      if (error) {
        console.error("Error submitting complaint:", error);
        toast({ title: "Error", description: `Failed to submit complaint: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Complaint submitted successfully." });
        setComplaintCategory("");
        setComplaintDetails("");
      }
    } catch (e: any) {
      console.error("Unexpected error:", e);
      toast({ title: "Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Submit a Complaint/Grievance</CardTitle>
          <CardDescription>
            Use this form to report any issues, concerns, or grievances.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitComplaint} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="complaintCategory">Category</Label>
              <Select onValueChange={setComplaintCategory} value={complaintCategory}>
                <SelectTrigger id="complaintCategory">
                  <SelectValue placeholder="Select complaint category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="workplace_issue">Workplace Issue</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="equipment_problem">Equipment/Resource Problem</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaintDetails">Details of Complaint</Label>
              <Textarea
                id="complaintDetails"
                placeholder="Provide a detailed description of your complaint..."
                value={complaintDetails}
                onChange={(e) => setComplaintDetails(e.target.value)}
                rows={6}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !user}>
              {isLoading ? "Submitting..." : "Submit Complaint"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
