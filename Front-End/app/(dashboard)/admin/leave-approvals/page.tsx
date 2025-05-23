"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AdminLeaveApprovalsPage() {
  // Mock data
  const leaveRequests = [
    { id: "1", name: "John Doe", email: "john@example.com", type: "Vacation", start: "2024-07-01", end: "2024-07-05", status: "pending" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", type: "Sick", start: "2024-07-10", end: "2024-07-12", status: "pending" },
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Leave Approvals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Start</th>
                  <th className="text-left p-2">End</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaveRequests.map(req => (
                  <tr key={req.id} className="border-b">
                    <td className="p-2">{req.name}</td>
                    <td className="p-2">{req.email}</td>
                    <td className="p-2">{req.type}</td>
                    <td className="p-2">{req.start}</td>
                    <td className="p-2">{req.end}</td>
                    <td className="p-2">{req.status}</td>
                    <td className="p-2 space-x-2">
                      <Button size="sm" variant="secondary">Approve</Button>
                      <Button size="sm" variant="destructive">Reject</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
