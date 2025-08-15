import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { Calendar, Clock, MapPin, Users, Edit, Trash2, UserPlus, UserMinus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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

interface EventDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onEdit: (event: Event) => void;
  onDelete: () => void;
  currentUserId?: string;
}

interface Registration {
  id: string;
  status: string;
  registered_at: string;
}

const EventDetails = ({ isOpen, onClose, event, onEdit, onDelete, currentUserId }: EventDetailsProps) => {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [registrationCount, setRegistrationCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (event && currentUserId && isOpen) {
      fetchRegistrationInfo();
    }
  }, [event, currentUserId, isOpen]);

  const fetchRegistrationInfo = async () => {
    if (!event || !currentUserId) return;

    try {
      // Check if user is registered
      const { data: userRegistration } = await supabase
        .from("event_registrations")
        .select("*")
        .eq("event_id", event.id)
        .eq("user_id", currentUserId)
        .eq("status", "registered")
        .single();

      setRegistration(userRegistration);

      // Get total registration count
      const { count } = await supabase
        .from("event_registrations")
        .select("*", { count: "exact", head: true })
        .eq("event_id", event.id)
        .eq("status", "registered");

      setRegistrationCount(count || 0);
    } catch (error) {
      console.error("Error fetching registration info:", error);
    }
  };

  const handleRegister = async () => {
    if (!event || !currentUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_registrations")
        .insert([{
          event_id: event.id,
          user_id: currentUserId,
          status: "registered"
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully registered for the event!",
      });

      fetchRegistrationInfo();
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

  const handleUnregister = async () => {
    if (!registration || !currentUserId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", registration.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Successfully unregistered from the event.",
      });

      fetchRegistrationInfo();
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

  const handleDeleteEvent = async () => {
    if (!event || !currentUserId) return;
    
    if (event.created_by !== currentUserId) {
      toast({
        title: "Error",
        description: "You can only delete events you created.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", event.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully.",
      });

      onDelete();
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

  if (!event) return null;

  const isEventCreator = currentUserId === event.created_by;
  const canRegister = !registration && event.is_public && !isEventCreator;
  const canUnregister = registration && registration.status === "registered";
  const isFull = event.max_attendees && registrationCount >= event.max_attendees;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{event.title}</span>
            <Badge variant="secondary">{event.event_type}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {event.description && (
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground">{event.description}</p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(event.start_time), "MMMM dd, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(event.start_time), "h:mm a")} - {format(parseISO(event.end_time), "h:mm a")}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">Location</p>
                      <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p className="text-sm text-muted-foreground">
                      {registrationCount} registered
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="font-medium">Visibility</p>
                  <Badge variant={event.is_public ? "default" : "secondary"}>
                    {event.is_public ? "Public" : "Private"}
                  </Badge>
                </div>

                {registration && (
                  <div>
                    <p className="font-medium">Your Registration</p>
                    <Badge variant="outline">
                      Registered on {format(parseISO(registration.registered_at), "MMM dd, yyyy")}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex gap-2">
              {canRegister && !isFull && (
                <Button onClick={handleRegister} disabled={loading}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Register
                </Button>
              )}

              {canRegister && isFull && (
                <Button disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Event Full
                </Button>
              )}

              {canUnregister && (
                <Button variant="outline" onClick={handleUnregister} disabled={loading}>
                  <UserMinus className="w-4 h-4 mr-2" />
                  Unregister
                </Button>
              )}
            </div>

            {isEventCreator && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onEdit(event)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={handleDeleteEvent} disabled={loading}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetails;