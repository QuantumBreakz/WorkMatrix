"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks";
import { getSupabaseBrowser } from "@/lib/supabase"; // Import Supabase client

// Placeholder for DatePicker components
const DatePickerPlaceholder = ({ selected, onSelect, placeholder, minDate }: { selected?: Date, onSelect: (date?: Date) => void, placeholder: string, minDate?: Date }) => (
  <Input 
    type="date" 
    value={selected ? selected.toISOString().split('T')[0] : ""} 
    onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
    placeholder={placeholder}
    min={minDate ? minDate.toISOString().split('T')[0] : undefined}
  />
);

export default function EmployeeLeavesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
      return;
    }
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    if (startDate > endDate) {
      toast({ title: "Error", description: "End date cannot be before start date.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseBrowser();

    try {
      const { error } = await supabase.from("leave_requests").insert({
        user_id: user.id,
        leave_type: leaveType,
        start_date: startDate.toISOString().split('T')[0], // Store as YYYY-MM-DD
        end_date: endDate.toISOString().split('T')[0],   // Store as YYYY-MM-DD
        reason: reason,
        status: "pending",
        // submitted_at will be set by default value in database (e.g., now())
      });

      if (error) {
        console.error("Error submitting leave request:", error);
        toast({ title: "Error", description: `Failed to submit leave request: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Leave request submitted successfully." });
        setLeaveType("");
        setStartDate(undefined);
        setEndDate(undefined);
        setReason("");
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
          <CardTitle>Apply for Leave</CardTitle>
          <CardDescription>
            Submit a request for planned time off.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitLeave} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select onValueChange={setLeaveType} value={leaveType}>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="personal">Personal Leave</SelectItem>
                  <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <DatePickerPlaceholder selected={startDate} onSelect={setStartDate} placeholder="Select start date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <DatePickerPlaceholder selected={endDate} onSelect={setEndDate} placeholder="Select end date" minDate={startDate} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Leave</Label>
              <Textarea
                id="reason"
                placeholder="Briefly explain the reason for your leave..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !user}>
              {isLoading ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
