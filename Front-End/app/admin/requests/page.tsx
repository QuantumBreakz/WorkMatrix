"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_requests")
      .select("*")
      .eq("status", "pending");
    if (!error) setRequests(data || []);
    setLoading(false);
  }

  async function approveRequest(request: any) {
    // Insert into admins table
    const { error: adminError } = await supabase.from("admins").insert([
      {
        id: crypto.randomUUID(),
        email: request.email,
        full_name: request.full_name,
        role: "admin",
        department: request.department,
        phone: request.phone,
        approved: true,
      },
    ]);
    if (adminError) {
      toast({ title: "Error", description: adminError.message, variant: "destructive" });
      return;
    }
    // Update request status
    const { error: reqError } = await supabase
      .from("admin_requests")
      .update({ status: "approved" })
      .eq("id", request.id);
    if (reqError) {
      toast({ title: "Error", description: reqError.message, variant: "destructive" });
      return;
    }
    toast({ title: "Admin approved", description: `${request.email} is now an admin.` });
    fetchRequests();
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Pending Admin Requests</CardTitle>
          <CardDescription>Approve new admin accounts below.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : requests.length === 0 ? (
            <div>No pending requests.</div>
          ) : (
            <ul className="space-y-4">
              {requests.map((req) => (
                <li key={req.id} className="flex flex-col md:flex-row md:items-center md:justify-between border p-4 rounded-md bg-white">
                  <div>
                    <div><b>Name:</b> {req.full_name}</div>
                    <div><b>Email:</b> {req.email}</div>
                    <div><b>Department:</b> {req.department}</div>
                    <div><b>Phone:</b> {req.phone}</div>
                  </div>
                  <Button className="mt-2 md:mt-0" onClick={() => approveRequest(req)}>
                    Approve
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
