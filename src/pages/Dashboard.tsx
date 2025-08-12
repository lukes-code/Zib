import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EventItem } from "@/types";
import { toast } from "@/components/ui/use-toast";
import alienBg from "@/assets/images/ufo.jpg";

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [pastEventsCount, setPastEventsCount] = useState(0);
  const [futureEventsCount, setFutureEventsCount] = useState(0);

  useEffect(() => {
    document.title = "Dashboard | Paylien";
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

  const joinEvent = async (id: string) => {
    const { error } = await supabase.rpc("join_event", { _event_id: id });
    if (error) {
      toast({
        title: "Unable to join",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Joined event" });
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
        <div className="w-full flex gap-4 bg-white/20 rounded-[25px] overflow-hidden">
          <div className="flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
            <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
              Credits Available
            </span>
            <span className="text-2xl font-bold text-left w-full">
              {credits}
            </span>
          </div>
          <div className="flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
            <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
              Past Events Attended
            </span>
            <span className="text-2xl font-bold text-left w-full">
              {pastEventsCount}
            </span>
          </div>
          <div className="flex-1 py-4 px-8 flex flex-col items-center text-white backdrop-blur-md">
            <span className="text-sm font-medium uppercase tracking-wide text-left w-full">
              Future Events Attending
            </span>
            <span className="text-2xl font-bold text-left w-full">
              {futureEventsCount}
            </span>
          </div>
        </div>

        <Separator />

        <section>
          <h2 className="text-xl font-medium mb-4 text-white drop-shadow">
            Upcoming events
          </h2>
          {loading ? (
            <p className="text-muted-foreground">Loading events…</p>
          ) : events.length === 0 ? (
            <p className="text-muted-foreground">No upcoming events.</p>
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
                        {new Date(ev.event_date).toLocaleString()}
                      </p>
                      {ev.description ? (
                        <p className="text-sm">{ev.description}</p>
                      ) : null}
                      <p className="text-sm">
                        {ev.attendees_count}/{ev.capacity} spots
                      </p>
                      <Button
                        disabled={full || credits < 1 || isGoing}
                        onClick={() => joinEvent(ev.id)}
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
    </main>
  );
};

export default Dashboard;
