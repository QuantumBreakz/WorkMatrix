"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays, startOfDay, endOfDay, isSameDay } from "date-fns"
import { CalendarIcon, Clock, Users, MapPin, Video } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  startTime: Date
  endTime: Date
  type: "meeting" | "time-off" | "event"
  status: "scheduled" | "in-progress" | "completed" | "cancelled"
  location?: string
  meetingLink?: string
  attendees: string[]
  organizer: string
}

interface TeamMember {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false)
  const [isViewEventDialogOpen, setIsViewEventDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      router.push("/login/admin")
      return
    }
    loadCalendarData()
  }, [user, router])

  const loadCalendarData = async () => {
    try {
      // Load events
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .gte("start_time", startOfDay(selectedDate).toISOString())
        .lte("end_time", endOfDay(selectedDate).toISOString())

      if (eventError) throw eventError

      // Load team members
      const { data: memberData, error: memberError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "employee")

      if (memberError) throw memberError

      // Process events
      const processedEvents = eventData.map((event: any) => ({
        ...event,
        startTime: new Date(event.start_time),
        endTime: new Date(event.end_time),
      }))

      setEvents(processedEvents)
      setTeamMembers(memberData)
    } catch (error) {
      console.error("Error loading calendar data:", error)
      toast({
        title: "Error",
        description: "Failed to load calendar data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddEvent = async (formData: FormData) => {
    try {
      const title = formData.get("title") as string
      const description = formData.get("description") as string
      const type = formData.get("type") as Event["type"]
      const startTime = new Date(formData.get("startTime") as string)
      const endTime = new Date(formData.get("endTime") as string)
      const location = formData.get("location") as string
      const meetingLink = formData.get("meetingLink") as string
      const attendees = formData.getAll("attendees") as string[]

      const { data, error } = await supabase
        .from("events")
        .insert([
          {
            title,
            description,
            type,
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            location,
            meeting_link: meetingLink,
            attendees,
            organizer: user?.id,
            status: "scheduled",
          },
        ])
        .select()

      if (error) throw error

      toast({
        title: "Success",
        description: "Event created successfully",
      })

      setIsAddEventDialogOpen(false)
      loadCalendarData()
    } catch (error) {
      console.error("Error creating event:", error)
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      })
    }
  }

  const handleUpdateEventStatus = async (eventId: string, status: Event["status"]) => {
    try {
      const { error } = await supabase
        .from("events")
        .update({ status })
        .eq("id", eventId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Event status updated successfully",
      })

      loadCalendarData()
    } catch (error) {
      console.error("Error updating event status:", error)
      toast({
        title: "Error",
        description: "Failed to update event status",
        variant: "destructive",
      })
    }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.startTime, date))
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CalendarIcon className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Event</DialogTitle>
              <DialogDescription>
                Schedule a new event or meeting
              </DialogDescription>
            </DialogHeader>
            <form action={handleAddEvent}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" name="description" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Type</Label>
                  <Select name="type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="time-off">Time Off</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="meetingLink">Meeting Link</Label>
                  <Input id="meetingLink" name="meetingLink" />
                </div>
                <div className="grid gap-2">
                  <Label>Attendees</Label>
                  <Select name="attendees">
                    <SelectTrigger>
                      <SelectValue placeholder="Select attendees" />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Create Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <CardDescription>View and manage events</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date: Date | undefined) => date && setSelectedDate(date)}
                className="rounded-md border"
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Events for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
              <CardDescription>View scheduled events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <Badge
                          variant={
                            event.status === "scheduled"
                              ? "default"
                              : event.status === "in-progress"
                              ? "secondary"
                              : event.status === "completed"
                              ? "outline"
                              : "destructive"
                          }
                        >
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {format(event.startTime, "h:mm a")} -{" "}
                        {format(event.endTime, "h:mm a")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm">{event.description}</p>
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                        {event.meetingLink && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Video className="h-4 w-4" />
                            <a
                              href={event.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              Join Meeting
                            </a>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {event.attendees.length} attendees
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {getEventsForDate(selectedDate).length === 0 && (
                  <p className="text-center text-muted-foreground">
                    No events scheduled for this date
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isViewEventDialogOpen} onOpenChange={setIsViewEventDialogOpen}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedEvent.title}</DialogTitle>
                <DialogDescription>
                  {format(selectedEvent.startTime, "MMMM d, yyyy h:mm a")} -{" "}
                  {format(selectedEvent.endTime, "h:mm a")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
                {selectedEvent.location && (
                  <div>
                    <h4 className="font-medium mb-2">Location</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.location}
                    </p>
                  </div>
                )}
                {selectedEvent.meetingLink && (
                  <div>
                    <h4 className="font-medium mb-2">Meeting Link</h4>
                    <a
                      href={selectedEvent.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {selectedEvent.meetingLink}
                    </a>
                  </div>
                )}
                <div>
                  <h4 className="font-medium mb-2">Attendees</h4>
                  <div className="space-y-2">
                    {selectedEvent.attendees.map((attendeeId) => {
                      const attendee = teamMembers.find(
                        (member) => member.id === attendeeId
                      )
                      return (
                        <div
                          key={attendeeId}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Users className="h-4 w-4" />
                          {attendee?.fullName}
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  {selectedEvent.status === "scheduled" && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() =>
                          handleUpdateEventStatus(selectedEvent.id, "cancelled")
                        }
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          handleUpdateEventStatus(selectedEvent.id, "in-progress")
                        }
                      >
                        Start
                      </Button>
                    </>
                  )}
                  {selectedEvent.status === "in-progress" && (
                    <Button
                      onClick={() =>
                        handleUpdateEventStatus(selectedEvent.id, "completed")
                      }
                    >
                      Complete
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
} 
