"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getSupabaseBrowser } from "@/lib/supabase"; // Import Supabase client

// Placeholder for DatePicker components if you don't have them yet
const DatePickerPlaceholder = ({ selected, onSelect, placeholder }: { selected?: Date, onSelect: (date?: Date) => void, placeholder: string }) => (
  <Input 
    type="date" 
    value={selected ? selected.toISOString().split('T')[0] : ""} 
    onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
    placeholder={placeholder}
  />
);

export default function EmployeeCompensationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [overtimeDate, setOvertimeDate] = useState<Date | undefined>();
  const [hoursWorked, setHoursWorked] = useState("");
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitCompensation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Error", description: "You must be logged in to submit a request.", variant: "destructive" });
      return;
    }
    if (!overtimeDate || !hoursWorked.trim() || !reason.trim()) {
      toast({ title: "Error", description: "All fields are required.", variant: "destructive" });
      return;
    }
    const hours = parseFloat(hoursWorked);
    if (isNaN(hours) || hours <= 0) {
      toast({ title: "Error", description: "Please enter a valid number of hours.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    const supabase = getSupabaseBrowser();

    try {
      const { error } = await supabase.from("compensation_requests").insert({
        user_id: user.id,
        overtime_date: overtimeDate.toISOString().split('T')[0], // Store as YYYY-MM-DD string
        hours_worked: hours,
        reason: reason,
        status: "pending",
        // submitted_at will be set by default value in database (e.g., now())
      });

      if (error) {
        console.error("Error submitting compensation request:", error);
        toast({ title: "Error", description: `Failed to submit compensation request: ${error.message}`, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Compensation request submitted successfully." });
        // Reset form
        setOvertimeDate(undefined);
        setHoursWorked("");
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
          <CardTitle>Request Time Compensation</CardTitle>
          <CardDescription>
            Submit a request for overtime or time worked outside of regular hours.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitCompensation} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtimeDate">Date of Overtime</Label>
                <DatePickerPlaceholder selected={overtimeDate} onSelect={setOvertimeDate} placeholder="Select date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursWorked">Hours Worked (e.g., 2.5)</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  placeholder="Enter hours"
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(e.target.value)}
                  step="0.1"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Overtime/Compensation</Label>
              <Textarea
                id="reason"
                placeholder="Briefly explain the reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
              />
            </div>
            <Button type="submit" disabled={isLoading || !user}>
              {isLoading ? "Submitting..." : "Submit Compensation Request"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 
