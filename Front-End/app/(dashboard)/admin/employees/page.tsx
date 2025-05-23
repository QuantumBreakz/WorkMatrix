"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical, Search, Loader2, AlertTriangle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase-client"
import { useRouter } from "next/navigation"
import { ConnectionStatusCard } from "@/components/ui/connection-status"
import { useConnectionManager } from "@/hooks/use-connection-manager"

interface Employee {
  id: string
  email: string
  full_name: string
  created_at: string
  last_sign_in: string | null
  is_active: boolean
  role: string
  department: string | null
  phone: string | null
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()
  const router = useRouter()
  const { user, userRole } = useAuth()
  const { isConnected } = useConnectionManager()

  useEffect(() => {
    if (!user || userRole !== 'admin') {
      router.push('/login')
      return
    }
    fetchEmployees()
  }, [user, userRole, router])

  const fetchEmployees = async () => {
    if (!isConnected) {
      toast({
        title: "Connection Required",
        description: "Please ensure you are connected to the monitoring service to manage employees.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Process the data to include last sign in
      const processedData = await Promise.all(
        (data || []).map(async (employee) => {
          const { data: authData } = await supabase.auth.admin.getUserById(employee.id)
          return {
            ...employee,
            last_sign_in: authData?.user?.last_sign_in_at || null,
            is_active: authData?.user?.confirmed_at !== null,
          }
        })
      )

      setEmployees(processedData)
    } catch (error: any) {
      console.error("Error fetching employees:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleActive = async (employeeId: string, currentStatus: boolean) => {
    if (!isConnected) {
      toast({
        title: "Connection Required",
        description: "Please ensure you are connected to the monitoring service to update employee status.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        employeeId,
        { email_confirm: !currentStatus }
      )

      if (error) throw error

      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === employeeId ? { ...emp, is_active: !currentStatus } : emp
        )
      )

      toast({
        title: "Status updated",
        description: `Employee ${currentStatus ? "deactivated" : "activated"} successfully`,
      })
    } catch (error: any) {
      console.error("Error updating employee status:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update employee status",
        variant: "destructive",
      })
    }
  }

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!user || userRole !== 'admin') {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Employee Management</h1>
      </div>

      <ConnectionStatusCard />

      {isConnected ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Employee Accounts</CardTitle>
            <CardDescription>View and manage employee accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">Loading employees...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchQuery ? "No employees found matching your search" : "No employees found"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Sign In</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell className="font-medium">{employee.full_name}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>{employee.department || '-'}</TableCell>
                      <TableCell className="capitalize">{employee.role}</TableCell>
                      <TableCell>{format(new Date(employee.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {employee.last_sign_in
                          ? format(new Date(employee.last_sign_in), "MMM d, yyyy h:mm a")
                          : "Never"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.is_active
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {employee.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(employee.id, employee.is_active)}
                            >
                              {employee.is_active ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/employees/${employee.id}`)}
                            >
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Connection Required</h3>
            <p className="text-muted-foreground mb-4">
              Please connect to the monitoring service to manage employees.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
