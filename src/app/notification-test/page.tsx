"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationSeverity } from '@prisma/client';

export default function NotificationTestPage() {
  const [userId, setUserId] = useState('user123');
  const [type, setType] = useState<NotificationType>('TASK_COMPLETED' as NotificationType);
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message.');
  const [severity, setSeverity] = useState<NotificationSeverity>('INFO');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type,
          title,
          message,
          severity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Test notification sent successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to send notification',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Test</h1>
      
      <div className="grid gap-6 max-w-md">
        <div>
          <Label htmlFor="userId">User ID</Label>
          <Input
            id="userId"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="type">Notification Type</Label>
          <Select value={type} onValueChange={(value) => setType(value as NotificationType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NotificationType).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor="severity">Severity</Label>
          <Select value={severity} onValueChange={(value) => setSeverity(value as NotificationSeverity)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NotificationSeverity).map((severity) => (
                <SelectItem key={severity} value={severity}>
                  {severity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={sendTestNotification} disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send Test Notification'}
        </Button>
      </div>
    </div>
  );
}