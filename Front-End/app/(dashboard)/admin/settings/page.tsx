"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks"
import { getSupabaseBrowser } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Shield,
  Camera,
  HardDrive,
  Key,
  Save,
  Users,
  Settings,
  Building,
  AlertCircle,
  CheckCircle,
} from "lucide-react"

interface AdminSettings {
  notifications: {
    email: boolean
    desktop: boolean
    activityAlerts: boolean
    breakReminders: boolean
    teamAlerts: boolean
    systemAlerts: boolean
  }
  privacy: {
    screenshotBlur: boolean
    activityTracking: boolean
    dataRetention: number
    teamPrivacy: boolean
  }
  capture: {
    screenshotInterval: number
    videoQuality: string
    storageLimit: number
    teamCapture: boolean
  }
  storage: {
    used: number
    total: number
    autoCleanup: boolean
    teamStorage: boolean
  }
  api: {
    key: string
    lastUsed: string
    callsToday: number
    teamApi: boolean
  }
  team: {
    maxTeamSize: number
    defaultRole: string
    autoApproval: boolean
    teamInvites: boolean
  }
  organization: {
    name: string
    logo: string
    timezone: string
    workingHours: {
      start: string
      end: string
    }
  }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { user, userRole } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    if (!user || userRole !== "admin") {
      router.push("/login/admin")
      return
    }
    loadSettings()
  }, [user, userRole, router])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("user_id", user?.id)
        .single()

      if (error) throw error

      setSettings(data || {
        notifications: {
          email: true,
          desktop: true,
          activityAlerts: true,
          breakReminders: true,
          teamAlerts: true,
          systemAlerts: true,
        },
        privacy: {
          screenshotBlur: false,
          activityTracking: true,
          dataRetention: 30,
          teamPrivacy: true,
        },
        capture: {
          screenshotInterval: 5,
          videoQuality: "medium",
          storageLimit: 1024,
          teamCapture: true,
        },
        storage: {
          used: 0,
          total: 1024,
          autoCleanup: true,
          teamStorage: true,
        },
        api: {
          key: "",
          lastUsed: "",
          callsToday: 0,
          teamApi: true,
        },
        team: {
          maxTeamSize: 50,
          defaultRole: "employee",
          autoApproval: false,
          teamInvites: true,
        },
        organization: {
          name: "",
          logo: "",
          timezone: "UTC",
          workingHours: {
            start: "09:00",
            end: "17:00",
          },
        },
      })
    } catch (error) {
      console.error("Error loading settings:", error)
      toast({
        title: "Error",
        description: "Failed to load settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from("admin_settings")
        .upsert({
          user_id: user?.id,
          ...settings,
        })

      if (error) throw error

      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully",
      })
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
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

  if (!settings) return null

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Admin Settings</h1>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="capture">
            <Camera className="mr-2 h-4 w-4" />
            Capture
          </TabsTrigger>
          <TabsTrigger value="storage">
            <HardDrive className="mr-2 h-4 w-4" />
            Storage
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="mr-2 h-4 w-4" />
            API
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="mr-2 h-4 w-4" />
            Team
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building className="mr-2 h-4 w-4" />
            Organization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, email: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="desktop-notifications">Desktop Notifications</Label>
                <Switch
                  id="desktop-notifications"
                  checked={settings.notifications.desktop}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, desktop: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activity-alerts">Activity Alerts</Label>
                <Switch
                  id="activity-alerts"
                  checked={settings.notifications.activityAlerts}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, activityAlerts: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="break-reminders">Break Reminders</Label>
                <Switch
                  id="break-reminders"
                  checked={settings.notifications.breakReminders}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, breakReminders: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-alerts">Team Alerts</Label>
                <Switch
                  id="team-alerts"
                  checked={settings.notifications.teamAlerts}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, teamAlerts: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="system-alerts">System Alerts</Label>
                <Switch
                  id="system-alerts"
                  checked={settings.notifications.systemAlerts}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, systemAlerts: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control privacy preferences for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="screenshot-blur">Blur Sensitive Content</Label>
                <Switch
                  id="screenshot-blur"
                  checked={settings.privacy.screenshotBlur}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, screenshotBlur: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activity-tracking">Activity Tracking</Label>
                <Switch
                  id="activity-tracking"
                  checked={settings.privacy.activityTracking}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, activityTracking: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-privacy">Team Privacy</Label>
                <Switch
                  id="team-privacy"
                  checked={settings.privacy.teamPrivacy}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, teamPrivacy: checked },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-retention">Data Retention (days)</Label>
                <Input
                  id="data-retention"
                  type="number"
                  value={settings.privacy.dataRetention}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, dataRetention: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture">
          <Card>
            <CardHeader>
              <CardTitle>Capture Settings</CardTitle>
              <CardDescription>Configure screenshot and recording settings for your team</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="screenshot-interval">Screenshot Interval (minutes)</Label>
                <Input
                  id="screenshot-interval"
                  type="number"
                  value={settings.capture.screenshotInterval}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      capture: { ...settings.capture, screenshotInterval: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="video-quality">Video Quality</Label>
                <select
                  id="video-quality"
                  className="w-full p-2 border rounded"
                  value={settings.capture.videoQuality}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      capture: { ...settings.capture, videoQuality: e.target.value },
                    })
                  }
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage-limit">Storage Limit (MB)</Label>
                <Input
                  id="storage-limit"
                  type="number"
                  value={settings.capture.storageLimit}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      capture: { ...settings.capture, storageLimit: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-capture">Team Capture</Label>
                <Switch
                  id="team-capture"
                  checked={settings.capture.teamCapture}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      capture: { ...settings.capture, teamCapture: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>Monitor and manage storage usage for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span>{settings.storage.used}MB / {settings.storage.total}MB</span>
                </div>
                <Progress value={(settings.storage.used / settings.storage.total) * 100} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-cleanup">Automatic Cleanup</Label>
                <Switch
                  id="auto-cleanup"
                  checked={settings.storage.autoCleanup}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      storage: { ...settings.storage, autoCleanup: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-storage">Team Storage</Label>
                <Switch
                  id="team-storage"
                  checked={settings.storage.teamStorage}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      storage: { ...settings.storage, teamStorage: checked },
                    })
                  }
                />
              </div>
              <Button variant="outline" className="w-full">
                Clean Up Old Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Management</CardTitle>
              <CardDescription>Manage API access and usage for your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    type="password"
                    value={settings.api.key}
                    readOnly
                  />
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>API Usage</Label>
                <div className="text-sm text-muted-foreground">
                  <p>Last Used: {settings.api.lastUsed || "Never"}</p>
                  <p>Calls Today: {settings.api.callsToday}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-api">Team API Access</Label>
                <Switch
                  id="team-api"
                  checked={settings.api.teamApi}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      api: { ...settings.api, teamApi: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle>Team Settings</CardTitle>
              <CardDescription>Configure team management settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="max-team-size">Maximum Team Size</Label>
                <Input
                  id="max-team-size"
                  type="number"
                  value={settings.team.maxTeamSize}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      team: { ...settings.team, maxTeamSize: parseInt(e.target.value) },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-role">Default Role</Label>
                <select
                  id="default-role"
                  className="w-full p-2 border rounded"
                  value={settings.team.defaultRole}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      team: { ...settings.team, defaultRole: e.target.value },
                    })
                  }
                >
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-approval">Auto-approve Team Members</Label>
                <Switch
                  id="auto-approval"
                  checked={settings.team.autoApproval}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      team: { ...settings.team, autoApproval: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="team-invites">Allow Team Invites</Label>
                <Switch
                  id="team-invites"
                  checked={settings.team.teamInvites}
                  onCheckedChange={(checked: boolean) =>
                    setSettings({
                      ...settings,
                      team: { ...settings.team, teamInvites: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="organization">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>Configure your organization's settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={settings.organization.name}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      organization: { ...settings.organization, name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-logo">Organization Logo</Label>
                <Input
                  id="org-logo"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      // Handle file upload
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  className="w-full p-2 border rounded"
                  value={settings.organization.timezone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      organization: { ...settings.organization, timezone: e.target.value },
                    })
                  }
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">EST</option>
                  <option value="PST">PST</option>
                  <option value="GMT">GMT</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="working-hours-start">Working Hours Start</Label>
                  <Input
                    id="working-hours-start"
                    type="time"
                    value={settings.organization.workingHours.start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        organization: {
                          ...settings.organization,
                          workingHours: {
                            ...settings.organization.workingHours,
                            start: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="working-hours-end">Working Hours End</Label>
                  <Input
                    id="working-hours-end"
                    type="time"
                    value={settings.organization.workingHours.end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        organization: {
                          ...settings.organization,
                          workingHours: {
                            ...settings.organization.workingHours,
                            end: e.target.value,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
