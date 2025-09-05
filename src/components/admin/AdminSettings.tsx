"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react'

interface SystemSettings {
  userPermissions: {
    allowRegistration: boolean
    requireEmailVerification: boolean
    enableTwoFactor: boolean
    maxDailyVideos: number
  }
  contentModeration: {
    autoApprove: boolean
    requireReview: boolean
    bannedWords: string
    maxVideoLength: number
  }
  notifications: {
    emailEnabled: boolean
    pushEnabled: boolean
    adminAlerts: boolean
    maintenanceMode: boolean
  }
  apiConfiguration: {
    rateLimit: number
    timeout: number
    enableCaching: boolean
    cacheExpiry: number
  }
}

interface AdminSettingsProps {
  settings: SystemSettings
  onSave: (settings: SystemSettings) => Promise<void>
  onReset: () => void
}

export default function AdminSettings({ settings, onSave, onReset }: AdminSettingsProps) {
  const [activeTab, setActiveTab] = useState('system')
  const [isSaving, setIsSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const form = useForm<SystemSettings>({
    defaultValues: settings
  })

  const handleSave = async (data: SystemSettings) => {
    setIsSaving(true)
    setSaveStatus('idle')

    try {
      await onSave(data)
      setSaveStatus('success')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error) {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    form.reset(settings)
    onReset()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure system settings and preferences</p>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Settings saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Save failed</span>
            </div>
          )}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
            </TabsList>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Configuration</CardTitle>
                  <CardDescription>
                    General system settings and maintenance options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="notifications.maintenanceMode"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Maintenance Mode</FormLabel>
                          <FormDescription>
                            Enable maintenance mode to prevent user access during updates
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notifications.emailEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Enable system email notifications
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notifications.pushEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Push Notifications</FormLabel>
                          <FormDescription>
                            Enable push notifications for mobile apps
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notifications.adminAlerts"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Admin Alerts</FormLabel>
                          <FormDescription>
                            Receive alerts for critical system events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* User Settings */}
            <TabsContent value="users" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Permissions</CardTitle>
                  <CardDescription>
                    Configure user registration and permission settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="userPermissions.allowRegistration"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Allow Registration</FormLabel>
                          <FormDescription>
                            Allow new users to register accounts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPermissions.requireEmailVerification"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Verification</FormLabel>
                          <FormDescription>
                            Require email verification for new accounts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPermissions.enableTwoFactor"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                          <FormDescription>
                            Enable 2FA option for user accounts
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPermissions.maxDailyVideos"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Daily Videos</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="100"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum number of videos a user can watch per day
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Settings */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Moderation</CardTitle>
                  <CardDescription>
                    Configure content approval and moderation settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="contentModeration.autoApprove"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Auto-approve Content</FormLabel>
                          <FormDescription>
                            Automatically approve uploaded videos
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentModeration.requireReview"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Require Manual Review</FormLabel>
                          <FormDescription>
                            All content must be manually reviewed before approval
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentModeration.maxVideoLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Video Length (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="120"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum allowed video length in minutes
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contentModeration.bannedWords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banned Words</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter banned words separated by commas"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          List of words that will trigger content review
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    Configure API rate limiting and caching settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="apiConfiguration.enableCaching"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Caching</FormLabel>
                          <FormDescription>
                            Enable API response caching for better performance
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="apiConfiguration.rateLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate Limit (requests/minute)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="10"
                              max="10000"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum API requests per minute per user
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="apiConfiguration.timeout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Request Timeout (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="5"
                              max="300"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Maximum time to wait for API responses
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="apiConfiguration.cacheExpiry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cache Expiry (minutes)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            max="1440"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          How long to cache API responses
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Separator />

          <div className="flex justify-between items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" type="button">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset all settings to their default values? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button type="submit" disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}