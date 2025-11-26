import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/useAuth";
import type { EventItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import alienBg from "@/assets/images/ufo.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import dayjs from "dayjs";
import ConfirmationModal from "@/components/ui/modal";
import { toast } from "react-toastify";
import { CalendarIcon, ClockIcon } from "@radix-ui/react-icons";
import { UsersIcon } from "lucide-react";
import { downloadICS } from "@/helpers/downloadICS";

const Dashboard = () => {
  const { profile, refreshProfile } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedEventIds, setJoinedEventIds] = useState<string[]>([]);
  const [pastEventsCount, setPastEventsCount] = useState(0);
  const [futureEventsCount, setFutureEventsCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const [showPositionModal, setShowPositionModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Dashboard | Pentyrch Aliens";
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, event_date, capacity, attendees_count, created_by, type"
      )
      .gte("event_date", new Date().toISOString())
      .order("event_date", { ascending: true });

    if (error) toast.error(error.message);
    else setEvents((data ?? []) as EventItem[]);
    setLoading(false);
  };

  const loadJoinedEvents = async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("event_attendees")
      .select("event_id")
      .eq("user_id", profile.id);

    if (error) {
      // Failed to load joined events
      toast.error(error.message);
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
      // Failed to load event counts
      toast.error(error.message);
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
      // Failed to join event
      toast.error(error.message);
    } else {
      toast(`Joined event with position ${position}`);
      await loadEvents();
      await loadJoinedEvents();
      await loadEventCounts();
      await refreshProfile();
    }
  };

  const credits = useMemo(() => profile?.credits ?? 0, [profile]);

  const handleAddToCalendar = (ev: EventItem) => {
    downloadICS(ev);
  };

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto sm:ml-[96px] transition-all duration-300">
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
          <span
            className={`${
              profile?.registered ? "bg-green-500 shadow-sm" : "bg-red-500"
            } text-white py-1 px-2 rounded-full mt-1 text-sm`}
          >
            {profile?.registered ? "Registered" : "Unregistered player"}
          </span>
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

        <section className="flex items-center gap-x-2">
          <a
            href={`https://buy.stripe.com/9B65kD2LEc55fD1bpP4wM00?prefilled_email=${profile?.email}`}
            target="_blank"
          >
            <Button>Buy 1 credit</Button>
          </a>
          <div className="relative inline-block">
            <Button onClick={() => setShowTooltip((prev) => !prev)}>
              Bulk buy credits and save
            </Button>

            {showTooltip && (
              <ConfirmationModal
                open={showTooltip}
                hideButtons={true}
                onCancel={() => setShowTooltip(false)}
                title="Bulk buy"
                message="For bulk orders and savings, please contact Jan in the WhatsApp group."
              />
            )}
          </div>
        </section>

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
                const spotsLeft = ev.capacity - ev.attendees_count;

                return (
                  <Card key={ev.id} className="relative overflow-hidden">
                    <CardContent className="space-y-3 p-4 flex flex-col h-full">
                      <div>
                        <h3 className="text-lg font-semibold">{ev.title}</h3>
                        <p className="text-sm text-gray-500">
                          <span className="capitalize">{ev.type}</span>
                          {ev.description ? ` - ${ev.description}` : null}
                        </p>
                      </div>

                      <div className="space-y-1 text-sm text-gray-600 flex-1">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />{" "}
                          {dayjs(ev.event_date).format("ddd, MMM D")}
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />{" "}
                          {dayjs(ev.event_date).format("h:mm A")}
                        </div>

                        {ev.type === "training" && (
                          <>
                            <div className="flex items-center gap-1">
                              <UsersIcon className="w-4 h-4" />{" "}
                              {ev.attendees_count}/{ev.capacity} attending
                            </div>
                            <div className="pt-6">
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${
                                      (ev.attendees_count / ev.capacity) * 100
                                    }%`,
                                    backgroundColor:
                                      ev.attendees_count / ev.capacity < 0.5
                                        ? "#3b82f6" // blue
                                        : ev.attendees_count / ev.capacity < 0.8
                                        ? "#f59e0b" // orange
                                        : "#ef4444", // red
                                  }}
                                />
                              </div>
                              <p
                                className="text-xs"
                                style={{
                                  color:
                                    ev.attendees_count / ev.capacity < 0.5
                                      ? "#3b82f6"
                                      : ev.attendees_count / ev.capacity < 0.8
                                      ? "#f59e0b"
                                      : "#ef4444",
                                }}
                              >
                                {spotsLeft > 0
                                  ? `${spotsLeft} ${
                                      spotsLeft === 1 ? "spot" : "spots"
                                    } left`
                                  : "Session full"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {ev.type === "training" ? (
                        <div className="flex gap-x-2">
                          <Button
                            className="w-full"
                            variant={isGoing ? "secondary" : "primary"}
                            onClick={() => {
                              if (isGoing) return;
                              setSelectedEventId(ev.id);
                              setShowPositionModal(true);
                            }}
                            disabled={full || credits < 1 || isGoing}
                          >
                            {isGoing
                              ? "You're going"
                              : full
                              ? "Full"
                              : credits < 1
                              ? "Not enough credits"
                              : "Attend event"}
                          </Button>
                          {isGoing && (
                            <Button
                              className="w-full mt-auto"
                              variant="primary"
                              onClick={() => handleAddToCalendar(ev)}
                            >
                              Add to Calendar{" "}
                              <CalendarIcon className="w-4 h-4" />{" "}
                            </Button>
                          )}
                        </div>
                      ) : (
                        <Button
                          className="w-full mt-auto"
                          variant="primary"
                          onClick={() => handleAddToCalendar(ev)}
                        >
                          Add to Calendar <CalendarIcon className="w-4 h-4" />{" "}
                        </Button>
                      )}
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
        message="Please select your position"
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
