"use client"

import { SignUpForm } from "@/components/auth/SignUpForm"

export default function EmployeeRegisterPage() {
  return (
    <div className="container flex items-center justify-center min-h-screen py-8">
      <SignUpForm role="employee" />
    </div>
  )
}
