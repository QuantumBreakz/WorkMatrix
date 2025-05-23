"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { CalendarIcon, Plus, Users, Clock, BarChart3, Calendar as CalendarIcon2, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string
  status: "planning" | "active" | "on-hold" | "completed"
  priority: "low" | "medium" | "high"
  startDate: Date
  endDate: Date
  progress: number
  team: string[]
  tasks: Task[]
  budget: number
  client: string
}

interface Task {
  id: string
  title: string
  description: string
  status: "todo" | "in-progress" | "review" | "completed"
  assignee: string
  dueDate: Date
  priority: "low" | "medium" | "high"
}

interface TeamMember {
  id: string
  name: string
  role: string
  avatar: string
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProject, setNewProject] = useState<Partial<Project>>({
    status: "planning",
    priority: "medium",
    progress: 0,
    team: [],
    tasks: [],
  })
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login/admin")
      return
    }
    loadProjects()
    loadTeamMembers()
  }, [user, router])

  const loadProjects = async () => {
    try {
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false })

      if (projectError) throw projectError

      setProjects(
        projectData.map((proj: any) => ({
          ...proj,
          startDate: new Date(proj.start_date),
          endDate: new Date(proj.end_date),
          tasks: proj.tasks || [],
        }))
      )
    } catch (error) {
      console.error("Error loading projects:", error)
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTeamMembers = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")

      if (memberError) throw memberError

      setTeamMembers(
        memberData.map((member: any) => ({
          id: member.id,
          name: member.full_name,
          role: member.role,
          avatar: member.avatar_url,
        }))
      )
    } catch (error) {
      console.error("Error loading team members:", error)
      toast({
        title: "Error",
        description: "Failed to load team members",
        variant: "destructive",
      })
    }
  }

  const handleCreateProject = async () => {
    try {
      const { data, error } = await supabase.from("projects").insert([
        {
          ...newProject,
          start_date: newProject.startDate,
          end_date: newProject.endDate,
        },
      ]).select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Project created successfully",
      })

      setIsCreateDialogOpen(false)
      setNewProject({
        status: "planning",
        priority: "medium",
        progress: 0,
        team: [],
        tasks: [],
      })
      loadProjects()
    } catch (error) {
      console.error("Error creating project:", error)
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "planning":
        return "bg-blue-100 text-blue-800"
      case "on-hold":
        return "bg-yellow-100 text-yellow-800"
      case "completed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>
                Fill in the project details below to create a new project.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={newProject.name || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newProject.description || ""}
                  onChange={(e) =>
                    setNewProject({ ...newProject, description: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon2 className="mr-2 h-4 w-4" />
                        {newProject.startDate ? (
                          format(newProject.startDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newProject.startDate}
                        onSelect={(date: Date | undefined) =>
                          setNewProject({ ...newProject, startDate: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="grid gap-2">
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon2 className="mr-2 h-4 w-4" />
                        {newProject.endDate ? (
                          format(newProject.endDate, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newProject.endDate}
                        onSelect={(date: Date | undefined) =>
                          setNewProject({ ...newProject, endDate: date })
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select
                    value={newProject.status}
                    onValueChange={(value: any) =>
                      setNewProject({ ...newProject, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on-hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Priority</Label>
                  <Select
                    value={newProject.priority}
                    onValueChange={(value: any) =>
                      setNewProject({ ...newProject, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Team Members</Label>
                <Select
                  value={newProject.team?.[0] || ""}
                  onValueChange={(value) =>
                    setNewProject({
                      ...newProject,
                      team: [...(newProject.team || []), value],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team members" />
                  </SelectTrigger>
                  <SelectContent>
                    {teamMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newProject.team?.map((memberId) => {
                    const member = teamMembers.find((m) => m.id === memberId)
                    return member ? (
                      <Badge key={memberId} variant="secondary">
                        {member.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>Create Project</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Projects</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="on-hold">On Hold</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription>{project.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                    <Badge className={getPriorityColor(project.priority)}>
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Timeline</p>
                      <p className="text-sm text-muted-foreground">
                        {format(project.startDate, "MMM d, yyyy")} -{" "}
                        {format(project.endDate, "MMM d, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Team</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.team.map((memberId) => {
                          const member = teamMembers.find((m) => m.id === memberId)
                          return member ? (
                            <Badge key={memberId} variant="secondary">
                              {member.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {project.team.length} team members
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {project.tasks.filter((t) => t.status === "completed").length} tasks completed
                  </span>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          {projects
            .filter((p) => p.status === "active")
            .map((project) => (
              <Card key={project.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {projects
            .filter((p) => p.status === "completed")
            .map((project) => (
              <Card key={project.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="on-hold" className="space-y-4">
          {projects
            .filter((p) => p.status === "on-hold")
            .map((project) => (
              <Card key={project.id}>
                {/* Same card content as above */}
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
} 
