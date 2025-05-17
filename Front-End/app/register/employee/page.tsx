"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function EmployeeRegisterPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [cooldownActive, setCooldownActive] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const { signUp: authSignUp, signInWithGoogle, user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")

  useEffect(() => {
    if (user?.id) {
      if (user.role === "admin") {
        router.push("/admin/dashboard")
      } else if (user.role === "employee") {
        router.push("/employee/dashboard")
      } else {
        router.push("/")
      }
    }
  }, [user, router])

  // Handle cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout

    if (cooldownActive && cooldownTime > 0) {
      timer = setInterval(() => {
        setCooldownTime((prev) => {
          if (prev <= 1) {
            setCooldownActive(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [cooldownActive, cooldownTime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if cooldown is active
    if (cooldownActive) {
      toast({
        title: "Please wait",
        description: `You can try again in ${cooldownTime} seconds`,
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid email format",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    // Check for common test domains that Supabase might reject
    const potentiallyRestrictedDomains = ["test.com", "example.com", "user.com", "domain.com"]
    const emailDomain = email.split("@")[1]

    if (potentiallyRestrictedDomains.includes(emailDomain)) {
      toast({
        title: "Email domain not supported",
        description: "Please use your actual email address. Test domains are not supported.",
        variant: "destructive",
      })
      return
    }

    // Validate password length
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password should be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await authSignUp({
        email,
        password,
        full_name: fullName,
        role: "employee",
        department: "General",
        phone: "",
      })

      if (error) {
        if (error.message?.includes("security purposes")) {
          const seconds = parseInt(error.message.match(/(\d+) seconds/)?.[1] || "60", 10)
          setCooldownTime(seconds)
          setCooldownActive(true)
          
          // Start cooldown timer
          const timer = setInterval(() => {
            setCooldownTime((prev) => {
              if (prev <= 1) {
                clearInterval(timer)
                setCooldownActive(false)
                return 0
              }
              return prev - 1
            })
          }, 1000)
        }
        throw error
      }

      // Clear form
      setEmail("")
      setPassword("")
      setFullName("")
      
      router.push("/login?message=Please check your email to verify your account")
    } catch (error) {
      console.error("Registration error:", error)
      toast({
        title: "Registration failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // After successful OAuth, the user will be redirected to the callback URL
      // The profile will be created automatically through the Supabase trigger
      toast({
        title: "Redirecting to Google",
        description: "Please complete the Google authentication process",
      });
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Google login failed",
        description: error?.message || "An error occurred during Google login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Employee Account</CardTitle>
          <CardDescription>Sign up for WorkMatrix to start tracking your work</CardDescription>
        </CardHeader>
        <CardContent>
          {cooldownActive && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Please wait {cooldownTime} seconds before trying again</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>
            <TabsContent value="email">
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">Password must be at least 6 characters long</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading || cooldownActive}>
                  {isLoading
                    ? "Creating account..."
                    : cooldownActive
                      ? `Wait ${cooldownTime}s`
                      : "Register as Employee"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="google" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Sign up with your Google account for quick and secure access.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-center gap-2"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    "Connecting to Google..."
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="24"
                        height="24"
                        className="w-5 h-5"
                      >
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                      </svg>
                      Continue with Google
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  By continuing with Google, you'll create an employee account using your Google profile information.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Separator />
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link href="/login/employee" className="text-blue-500 hover:text-blue-600">
              Login as Employee
            </Link>
          </div>
          <div className="text-center text-sm">
            <Link href="/register/admin" className="text-gray-500 hover:text-gray-600">
              Register as Admin
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
