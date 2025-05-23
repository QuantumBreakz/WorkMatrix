// components/employee/RequestForm.tsx
"use client";

import React, { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RequestFormProps {
  type: "leave" | "compensation";
}

export const RequestForm: React.FC<RequestFormProps> = ({ type }) => {
  const supabase = createClientComponentClient();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Leave fields
  const [leaveType, setLeaveType] = useState("sick");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  // Compensation fields
  const [amount, setAmount] = useState("");
  const [compDate, setCompDate] = useState("");
  const [description, setDescription] = useState("");

  const resetForm = () => {
    setLeaveType("sick");
    setStartDate("");
    setEndDate("");
    setReason("");
    setAmount("");
    setCompDate("");
    setDescription("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    const ticketId = `REQ-${Date.now()}`;

    const payload: any = {
      ticket_id: ticketId,
      request_type: type,
      user_id: user.id,
      status: "pending",
    };

    if (type === "leave") {
      if (!startDate || !endDate) {
        setErrorMsg("Please select start and end dates.");
        setLoading(false);
        return;
      }
      payload.leave_type = leaveType;
      payload.start_date = startDate;
      payload.end_date = endDate;
      payload.reason = reason;
    } else {
      if (!amount || !compDate) {
        setErrorMsg("Please enter amount and date.");
        setLoading(false);
        return;
      }
      payload.amount = parseFloat(amount);
      payload.compensation_date = compDate;
      payload.description = description;
    }

    const { error } = await supabase.from("requests").insert(payload);
    if (error) {
      setErrorMsg(error.message);
    } else {
      resetForm();
    }

    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New {type === "leave" ? "Leave" : "Compensation"} Request</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "leave" ? (
            <>
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <select
                  id="leaveType"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="mt-1 block w-full border rounded px-2 py-1"
                >
                  <option value="sick">Sick</option>
                  <option value="vacation">Vacation</option>
                  <option value="personal">Personal</option>
                </select>
              </div>
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reason">Reason</Label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1 block w-full border rounded px-2 py-1"
                  rows={3}
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="compDate">Date</Label>
                <Input
                  id="compDate"
                  type="date"
                  value={compDate}
                  onChange={(e) => setCompDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1 block w-full border rounded px-2 py-1"
                  rows={3}
                />
              </div>
            </>
          )}

          {errorMsg && <p className="text-red-600">{errorMsg}</p>}

          <Button type="submit" disabled={loading}>
            {loading ? "Submitting…" : "Submit Request"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
