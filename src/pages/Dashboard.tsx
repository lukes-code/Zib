import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EventItem } from "@/types";
import { toast } from "@/components/ui/use-toast";
import alienBg from "@/assets/images/ufo.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import ConfirmationModal from "@/components/ui/modal";

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [pastEventsCount, setPastEventsCount] = useState(0);
  const [futureEventsCount, setFutureEventsCount] = useState(0);

  // State for the modal and selected event & position
  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Dashboard | Zib";
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, event_date, capacity, attendees_count, created_by"
      )
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true });

    if (error) {
      toast({
        title: "Failed to load events",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setEvents((data ?? []) as EventItem[]);
    }
    setLoading(false);
  };

  const loadJoinedEvents = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", profile.id);

    if (error) {
      toast({
        title: "Failed to load joined events",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setJoinedEventIds((data ?? []).map((d) => d.event_id));
    }
  };

  const loadEventCounts = async () => {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id, events!inner(event_date)")
      .eq("user_id", profile.id);

    if (error) {
      toast({
        title: "Failed to load event counts",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    const past = data?.filter(
      (e) => new Date(e.events.event_date) < now
    ).length;
    const future = data?.filter(
      (e) => new Date(e.events.event_date) >= now
    ).length;

    setPastEventsCount(past || 0);
    setFutureEventsCount(future || 0);
  };

  useEffect(() => {
    loadEvents();
    loadJoinedEvents();
    loadEventCounts();
  }, [profile?.id]);

  const joinEventWithPosition = async (
    id: string,
    position: "defender" | "forward" | "goalie" | "any"
  ) => {
    const { error } = await supabase.rpc("join_event", {
      _event_id: id,
      _position: position,
    });

    if (error) {
      toast({
        title: "Unable to join",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: `Joined event with position ${position}` });
      await loadEvents();
      await loadJoinedEvents();
      await loadEventCounts();
      await refreshProfile();
    }
  };

  const credits = useMemo(() => profile?.credits ?? 0, [profile]);

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto">
      {/* Background image */}
      <div
        className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${alienBg})` }}
      />

      {/* Page content on top */}
      <section className="relative z-10 container mx-auto px-6 pt-12 space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-white drop-shadow">
            Welcome back{" "}
            <span className="text-white font-normal">
              {profile?.name || "User"}
            </span>
          </h1>
        </header>

        {/* Stats bar */}
        <div className="w-full flex flex-col md:flex-row gap-4 md:bg-white/20 md:rounded-[25px] overflow-hidden">
          {loading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md"
                >
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="bg-white/20 md:bg-transparent rounded-[25px] md:rounded-none flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
                <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
                  Credits
                </span>
                <span className="text-2xl font-bold text-left w-full">
                  {credits}
                </span>
              </div>
              <div className="bg-white/20 md:bg-transparent rounded-[25px] md:rounded-none flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
                <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
                  Attended
                </span>
                <span className="text-2xl font-bold text-left w-full">
                  {pastEventsCount}
                </span>
              </div>
              <div className="bg-white/20 md:bg-transparent rounded-[25px] md:rounded-none flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
                <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
                  Attending
                </span>
                <span className="text-2xl font-bold text-left w-full">
                  {futureEventsCount}
                </span>
              </div>
            </>
          )}
        </div>

        <Separator />

        <section>
          <h2 className="text-xl font-medium mb-4 text-black md:text-white drop-shadow">
            Upcoming events
          </h2>
          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-10 w-full rounded-md" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : events.length === 0 ? (
            <p className="text-black md:text-white">No upcoming events.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => {
                const isGoing = joinedEventIds.includes(ev.id);
                const full = ev.attendees_count >= ev.capacity;
                return (
                  <Card key={ev.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{ev.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {dayjs(ev.event_date).format("MMM D, YYYY h:mm A")}
                      </p>
                      {ev.description ? (
                        <p className="text-sm">{ev.description}</p>
                      ) : null}
                      <p className="text-sm">
                        {ev.attendees_count}/{ev.capacity} spots
                      </p>
                      <Button
                        disabled={full || credits < 1 || isGoing}
                        onClick={() => {
                          setSelectedEventId(ev.id);
                          setShowPositionModal(true);
                        }}
                      >
                        {isGoing
                          ? "You're going"
                          : full
                          ? "Full"
                          : credits < 1
                          ? "Not enough credits"
                          : "Join (1 credit)"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {/* Position selection modal */}
      <ConfirmationModal
        open={showPositionModal}
        title="Choose position"
        message="Please select your position: defender, forward, goalie, or any."
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        requireChoice={true}
        confirmVariant="primary"
        onConfirm={(position: "defender" | "forward" | "goalie" | "any") => {
          if (!position || !selectedEventId) return;
          joinEventWithPosition(selectedEventId, position);
          setShowPositionModal(false);
          setSelectedEventId(null);
        }}
        onCancel={() => {
          setShowPositionModal(false);
          setSelectedEventId(null);
        }}
      />
    </main>
  );
};

export default Dashboard;
