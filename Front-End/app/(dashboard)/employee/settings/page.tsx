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
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  Shield,
  Camera,
  HardDrive,
  Key,
  Save,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, UserPreferences, SecurityFormData, ProfileFormData } from "@/types/user"

interface Settings {
  notifications: {
    email: boolean
    desktop: boolean
    activityAlerts: boolean
    breakReminders: boolean
  }
  privacy: {
    screenshotBlur: boolean
    activityTracking: boolean
    dataRetention: number
  }
  capture: {
    screenshotInterval: number
    videoQuality: string
    storageLimit: number
  }
  storage: {
    used: number
    total: number
    autoCleanup: boolean
  }
  api: {
    key: string
    lastUsed: string
    callsToday: number
  }
}

export default function EmployeeSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const supabase = getSupabaseBrowser()
  const supabaseClient = createClientComponentClient()
  const [profileData, setProfileData] = useState<ProfileFormData>({
    full_name: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || "",
    designation: user?.designation || "",
    marital_status: user?.marital_status || "",
    employment_status: user?.employment_status || "",
    profile_picture: user?.profile_picture || "",
  })

  const [preferences, setPreferences] = useState<UserPreferences>({
    language: user?.preferences?.language || "en",
    timezone: user?.preferences?.timezone || "UTC",
    date_format: user?.preferences?.date_format || "MM/DD/YYYY",
    time_format: user?.preferences?.time_format || "12h",
  })

  const [security, setSecurity] = useState<SecurityFormData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
    two_factor_enabled: user?.security?.two_factor_enabled || false,
  })

  useEffect(() => {
    if (!user) {
      router.push("/login/employee")
      return
    }
    loadSettings()
  }, [user, router])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
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
        },
        privacy: {
          screenshotBlur: false,
          activityTracking: true,
          dataRetention: 30,
        },
        capture: {
          screenshotInterval: 5,
          videoQuality: "medium",
          storageLimit: 1024,
        },
        storage: {
          used: 0,
          total: 1024,
          autoCleanup: true,
        },
        api: {
          key: "",
          lastUsed: "",
          callsToday: 0,
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
        .from("user_settings")
        .upsert({
          user_id: user?.id,
          ...settings,
        })

      if (error) throw error

      toast({
        title: "Success",
        description: "Settings saved successfully",
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

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabaseClient
        .from("users")
        .update(profileData)
        .eq("id", user?.id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreferencesUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from("users")
        .update({
          preferences,
        })
        .eq("id", user?.id)

      if (error) throw error
      toast({
        title: "Success",
        description: "Preferences updated successfully",
      })
    } catch (error) {
      console.error("Error updating preferences:", error)
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSecurityUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (security.new_password !== security.confirm_password) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    try {
      // Update password
      if (security.new_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: security.new_password,
        })

        if (passwordError) throw passwordError
      }

      // Update two-factor status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          security: {
            ...user?.security,
            two_factor_enabled: security.two_factor_enabled,
            last_password_change: new Date().toISOString(),
          },
        })
        .eq("id", user?.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Security settings updated successfully",
      })

      // Clear password fields
      setSecurity(prev => ({
        ...prev,
        current_password: "",
        new_password: "",
        confirm_password: "",
      }))
    } catch (error) {
      console.error("Error updating security settings:", error)
      toast({
        title: "Error",
        description: "Failed to update security settings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split(".").pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabaseClient.storage
        .from("profile-pictures")
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabaseClient.storage
        .from("profile-pictures")
        .getPublicUrl(fileName)

      setProfileData(prev => ({ ...prev, profile_picture: publicUrl }))
      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      })
    } catch (error) {
      console.error("Error uploading profile picture:", error)
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      })
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
        <h1 className="text-3xl font-bold">Settings</h1>
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

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-picture">Profile Picture</Label>
                  <div className="flex items-center space-x-4">
                    <img
                      src={profileData.profile_picture || "/placeholder-avatar.png"}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <Input
                      type="file"
                      id="profile-picture"
                      accept="image/*"
                      onChange={handleProfilePictureChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData(prev => ({ ...prev, full_name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) =>
                        setProfileData(prev => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) =>
                        setProfileData(prev => ({ ...prev, department: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={profileData.designation}
                      onChange={(e) =>
                        setProfileData(prev => ({ ...prev, designation: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marital_status">Marital Status</Label>
                    <Select
                      value={profileData.marital_status}
                      onValueChange={(value) =>
                        setProfileData(prev => ({ ...prev, marital_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="single">Single</SelectItem>
                        <SelectItem value="married">Married</SelectItem>
                        <SelectItem value="divorced">Divorced</SelectItem>
                        <SelectItem value="widowed">Widowed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employment_status">Employment Status</Label>
                    <Select
                      value={profileData.employment_status}
                      onValueChange={(value) =>
                        setProfileData(prev => ({ ...prev, employment_status: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full-time">Full Time</SelectItem>
                        <SelectItem value="part-time">Part Time</SelectItem>
                        <SelectItem value="contract">Contract</SelectItem>
                        <SelectItem value="intern">Intern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={preferences.language}
                    onValueChange={(value) =>
                      setPreferences(prev => ({ ...prev, language: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) =>
                      setPreferences(prev => ({ ...prev, timezone: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time</SelectItem>
                      <SelectItem value="CST">Central Time</SelectItem>
                      <SelectItem value="PST">Pacific Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={preferences.date_format}
                    onValueChange={(value) =>
                      setPreferences(prev => ({ ...prev, date_format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time-format">Time Format</Label>
                  <Select
                    value={preferences.time_format}
                    onValueChange={(value) =>
                      setPreferences(prev => ({ ...prev, time_format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour</SelectItem>
                      <SelectItem value="24h">24-hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSecurityUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={security.current_password}
                    onChange={(e) =>
                      setSecurity(prev => ({ ...prev, current_password: e.target.value }))
                    }
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={security.new_password}
                    onChange={(e) =>
                      setSecurity(prev => ({ ...prev, new_password: e.target.value }))
                    }
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={security.confirm_password}
                    onChange={(e) =>
                      setSecurity(prev => ({ ...prev, confirm_password: e.target.value }))
                    }
                    placeholder="Confirm your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="two-factor"
                      checked={security.two_factor_enabled}
                      onChange={(e) =>
                        setSecurity(prev => ({ ...prev, two_factor_enabled: e.target.checked }))
                      }
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <Label htmlFor="two-factor" className="text-sm">
                      Enable two-factor authentication
                    </Label>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Saving..." : "Update Security Settings"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capture">
          <Card>
            <CardHeader>
              <CardTitle>Capture Settings</CardTitle>
              <CardDescription>Configure screenshot and recording settings</CardDescription>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>Storage Management</CardTitle>
              <CardDescription>Monitor and manage your storage usage</CardDescription>
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
              <CardDescription>Manage your API access and usage</CardDescription>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 
