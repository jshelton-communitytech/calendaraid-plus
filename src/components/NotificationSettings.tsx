import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Bell, Mail, Smartphone, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  email: boolean;
  push: boolean;
  reminder_times: number[];
}

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const NotificationSettings = ({ isOpen, onClose, userId }: NotificationSettingsProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email: true,
    push: false,
    reminder_times: [24, 1], // hours before event
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reminderOptions = [
    { value: 168, label: "1 week before" },
    { value: 72, label: "3 days before" },
    { value: 24, label: "1 day before" },
    { value: 12, label: "12 hours before" },
    { value: 6, label: "6 hours before" },
    { value: 3, label: "3 hours before" },
    { value: 1, label: "1 hour before" },
    { value: 0.5, label: "30 minutes before" },
    { value: 0.25, label: "15 minutes before" },
  ];

  useEffect(() => {
    if (isOpen && userId) {
      fetchPreferences();
    }
  }, [isOpen, userId]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("notification_preferences")
        .eq("user_id", userId)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        const prefs = data.notification_preferences as any;
        setPreferences({
          email: prefs.email ?? true,
          push: prefs.push ?? false,
          reminder_times: prefs.reminder_times ?? [24, 1]
        });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: preferences as any
        })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Notification preferences updated successfully",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleReminderTime = (time: number) => {
    setPreferences(prev => ({
      ...prev,
      reminder_times: prev.reminder_times.includes(time)
        ? prev.reminder_times.filter(t => t !== time)
        : [...prev.reminder_times, time].sort((a, b) => b - a)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notification Methods</CardTitle>
              <CardDescription>
                Choose how you'd like to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <Switch
                  id="email-notifications"
                  checked={preferences.email}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                  <Label htmlFor="push-notifications">Push Notifications</Label>
                </div>
                <Switch
                  id="push-notifications"
                  checked={preferences.push}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, push: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Reminder Times
              </CardTitle>
              <CardDescription>
                Select when you want to be reminded about events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {reminderOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`reminder-${option.value}`}
                      checked={preferences.reminder_times.includes(option.value)}
                      onCheckedChange={() => toggleReminderTime(option.value)}
                    />
                    <Label htmlFor={`reminder-${option.value}`} className="text-sm">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettings;