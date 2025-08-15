import { useState, useEffect } from "react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, isSameDay, parseISO } from "date-fns";
import { CalendarDays, Clock, MapPin, Users } from "lucide-react";
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
  registration_count?: number;
}

interface CalendarProps {
  onEventSelect: (event: Event) => void;
  onCreateEvent: () => void;
  refreshTrigger?: number;
}

const Calendar = ({ onEventSelect, onCreateEvent, refreshTrigger }: CalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          event_registrations!inner(count)
        `)
        .gte("start_time", new Date().toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;

      // Process the data to include registration counts
      const processedEvents = data?.map(event => ({
        ...event,
        registration_count: event.event_registrations?.length || 0
      })) || [];

      setEvents(processedEvents);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [refreshTrigger]);

  const eventsForSelectedDate = selectedDate
    ? events.filter(event => isSameDay(parseISO(event.start_time), selectedDate))
    : [];

  const getEventDates = () => {
    return events.map(event => parseISO(event.start_time));
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      general: "bg-blue-500",
      meeting: "bg-green-500",
      workshop: "bg-purple-500",
      social: "bg-orange-500",
      conference: "bg-red-500",
    };
    return colors[type as keyof typeof colors] || colors.general;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border"
            modifiers={{
              hasEvent: getEventDates(),
            }}
            modifiersStyles={{
              hasEvent: {
                fontWeight: "bold",
                backgroundColor: "hsl(var(--primary))",
                color: "hsl(var(--primary-foreground))",
              },
            }}
          />
          <div className="mt-4">
            <Button onClick={onCreateEvent} className="w-full">
              Create New Event
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {selectedDate ? format(selectedDate, "MMMM dd, yyyy") : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading events...</div>
          ) : eventsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {eventsForSelectedDate.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onEventSelect(event)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{event.title}</h3>
                    <Badge variant="secondary">{event.event_type}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {format(parseISO(event.start_time), "h:mm a")} - 
                      {format(parseISO(event.end_time), "h:mm a")}
                    </div>
                    
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {event.location}
                      </div>
                    )}
                    
                    {event.max_attendees && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {event.registration_count || 0} / {event.max_attendees} registered
                      </div>
                    )}
                  </div>
                  
                  {event.description && (
                    <p className="text-sm mt-2 text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No events scheduled for this date
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Calendar;