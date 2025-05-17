"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RegisterLandingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register for WorkMatrix</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button asChild className="w-full">
            <Link href="/register/employee">Register as Employee</Link>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <Link href="/register/admin">Register as Admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
