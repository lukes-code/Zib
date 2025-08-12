import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EventItem, Profile } from "@/types";
import { toast } from "@/components/ui/use-toast";

const Admin = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(26);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<
    { user_id: string; name: string }[]
  >([]);

  useEffect(() => {
    document.title = "Admin | Paylien";
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, event_date, capacity, attendees_count, created_by"
      )
      .order("event_date", { ascending: true });
    if (error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    setEvents((data ?? []) as EventItem[]);
  };
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, credits, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    setProfiles((data ?? []) as Profile[]);
  };

  useEffect(() => {
    Promise.all([loadEvents(), loadProfiles()]).finally(() =>
      setLoading(false)
    );
  }, []);

  const createEvent = async () => {
    if (!title || !date || capacity < 1) return;
    const { error } = await supabase.from("events").insert({
      title,
      description: description || null,
      event_date: new Date(date).toISOString(),
      capacity,
      created_by: user?.id ?? null,
    });
    if (error)
      return toast({
        title: "Create failed",
        description: error.message,
        variant: "destructive",
      });
    toast({ title: "Event created" });
    setTitle("");
    setDescription("");
    setDate("");
    setCapacity(26);
    await loadEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error)
      return toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    toast({ title: "Event deleted" });
    await loadEvents();
  };

  const adjustCredits = async (id: string, delta: number) => {
    const { error } = await supabase.rpc("admin_update_user_credits", {
      _user_id: id,
      _delta: delta,
      _note: "manual",
    });
    if (error)
      return toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    toast({ title: `Credits ${delta > 0 ? "added" : "removed"}` });
    await loadProfiles();
  };

  const viewAttendees = async (eventId: string) => {
    setSelectedEventId(eventId);
    const { data, error } = await supabase
      .from("event_attendees")
      .select("user_id, profiles(name)")
      .eq("event_id", eventId);

    if (error)
      return toast({
        title: "Load attendees failed",
        description: error.message,
        variant: "destructive",
      });

    // Map data to an array of objects with user_id and name
    const attendees = (data ?? []).map((d: any) => ({
      user_id: d.user_id,
      name: d.profiles?.name || "Unknown",
    }));

    setAttendees(attendees);
  };

  const removeAttendee = async (eventId: string, userId: string) => {
    const { error } = await supabase.rpc("admin_remove_attendee", {
      _event_id: eventId,
      _user_id: userId,
    });
    if (error)
      return toast({
        title: "Removal failed",
        description: error.message,
        variant: "destructive",
      });
    toast({ title: "Attendee removed and refunded" });
    await viewAttendees(eventId);
    await loadEvents();
    await loadProfiles();
  };

  return (
    <main className="flex-1 bg-background p-6 overflow-auto">
      <section className="container mx-auto p-4 space-y-8">
        <header>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage events, users, and credits.
          </p>
        </header>
        <Separator />

        <section className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Create Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <Input
                placeholder="Description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value || "0"))}
                />
                <span className="text-sm text-muted-foreground">Capacity</span>
              </div>
              <Button
                onClick={createEvent}
                disabled={!title || !date || capacity < 1}
              >
                Create
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users & Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[420px] overflow-auto">
              {loading ? (
                <p className="text-muted-foreground">Loading…</p>
              ) : profiles.length === 0 ? (
                <p className="text-muted-foreground">No users.</p>
              ) : (
                profiles.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">{p.name || p.email}</p>
                      <p className="text-xs text-muted-foreground">{p.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{p.credits} credits</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => adjustCredits(p.id, 1)}
                      >
                        +1
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => adjustCredits(p.id, -1)}
                      >
                        -1
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-medium">Events</h2>
          {events.length === 0 ? (
            <p className="text-muted-foreground">No events created.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
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
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => viewAttendees(ev.id)}
                      >
                        View attendees
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => deleteEvent(ev.id)}
                      >
                        Delete
                      </Button>
                    </div>
                    {selectedEventId === ev.id && (
                      <div className="pt-2 space-y-2">
                        <p className="text-sm font-medium">Attendees</p>
                        {attendees.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            No attendees.
                          </p>
                        ) : (
                          attendees.map((attendee) => (
                            <div
                              key={attendee.user_id}
                              className="flex items-center justify-between"
                            >
                              <span className="text-sm">{attendee.name}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  removeAttendee(ev.id, attendee.user_id)
                                }
                              >
                                Remove & refund
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default Admin;
