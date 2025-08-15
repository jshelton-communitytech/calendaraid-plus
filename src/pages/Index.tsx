import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import Calendar from "@/components/Calendar";
import EventDialog from "@/components/EventDialog";
import EventDetails from "@/components/EventDetails";
import NotificationSettings from "@/components/NotificationSettings";
import Auth from "@/pages/Auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { CalendarDays, Settings, User as UserIcon, LogOut, Bell, Calendar as CalendarIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  max_attendees: number | null;
  event_type: string;
  is_public: boolean;
  created_by: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEventSelect = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };

  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventDialog(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowEventDialog(true);
    setShowEventDetails(false);
  };

  const handleEventSave = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEventDelete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
                <CalendarDays className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CalendarAid Plus</h1>
                <p className="text-sm text-muted-foreground">Event Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotificationSettings(true)}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setShowNotificationSettings(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Calendar</h2>
              <p className="text-muted-foreground">Manage events, registrations, and notifications</p>
            </div>
            <Badge variant="outline" className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Event Manager
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateEvent} className="w-full">
                  Create New Event
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">✓ Event scheduling</div>
                <div className="text-sm text-muted-foreground">✓ User registration</div>
                <div className="text-sm text-muted-foreground">✓ Custom notifications</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground mb-2">
                  API-ready for easy integration with other apps
                </div>
                <Badge variant="secondary">Developer Friendly</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        <Calendar
          onEventSelect={handleEventSelect}
          onCreateEvent={handleCreateEvent}
          refreshTrigger={refreshTrigger}
        />

        <EventDialog
          isOpen={showEventDialog}
          onClose={() => setShowEventDialog(false)}
          event={editingEvent}
          onSave={handleEventSave}
        />

        <EventDetails
          isOpen={showEventDetails}
          onClose={() => setShowEventDetails(false)}
          event={selectedEvent}
          onEdit={handleEditEvent}
          onDelete={handleEventDelete}
          currentUserId={user?.id}
        />

        <NotificationSettings
          isOpen={showNotificationSettings}
          onClose={() => setShowNotificationSettings(false)}
          userId={user?.id || ""}
        />
      </main>
    </div>
  );
};

export default Index;
