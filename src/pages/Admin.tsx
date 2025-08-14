import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { EventItem, Profile } from "@/types";
import alienBg from "@/assets/images/ufo.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { TrashIcon } from "@radix-ui/react-icons";
import ConfirmationModal from "@/components/ui/modal";
import dayjs from "dayjs";
import { toast } from "react-toastify";

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

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState<() => void>(
    () => {}
  );
  const [confirmModalTitle, setConfirmModalTitle] = useState("");
  const [confirmModalMessage, setConfirmModalMessage] = useState("");

  const [attendees, setAttendees] = useState<
    { user_id: string; name: string; position: string }[]
  >([]);

  useEffect(() => {
    document.title = "Admin | Zib";
  }, []);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, event_date, capacity, attendees_count, created_by"
      )
      .order("event_date", { ascending: true });
    if (error) toast.error(error.message);
    setEvents((data ?? []) as EventItem[]);
  };
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, credits, created_at, updated_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
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
      // Create failed
      return toast.error(error.message);
    toast("Event created");
    setTitle("");
    setDescription("");
    setDate("");
    setCapacity(26);
    await loadEvents();
  };

  const handleDeleteEvent = (id: string) => {
    setConfirmModalTitle("Delete Event");
    setConfirmModalMessage(
      "Are you sure you want to delete this event? All attendees will be refunded."
    );
    setConfirmModalAction(() => async () => {
      setConfirmModalOpen(false);
      // Call your deleteEvent logic here (refunding attendees too)
      await deleteEvent(id);
    });
    setConfirmModalOpen(true);
  };

  const handleRemoveAttendee = (eventId: string, userId: string) => {
    setConfirmModalTitle("Remove Attendee");
    setConfirmModalMessage(
      "Are you sure you want to remove this attendee and refund their credit?"
    );
    setConfirmModalAction(() => async () => {
      setConfirmModalOpen(false);
      await removeAttendee(eventId, userId);
    });
    setConfirmModalOpen(true);
  };

  const deleteEvent = async (id: string) => {
    // Load attendees for this event
    const { data: attendeesData, error: attendeesError } = await supabase
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", id);

    if (attendeesError) {
      // Error loading attendees
      toast.error(attendeesError.message);
      return;
    }

    // Refund each attendee by calling the existing RPC
    for (const attendee of attendeesData ?? []) {
      const { error } = await supabase.rpc("admin_remove_attendee", {
        _event_id: id,
        _user_id: attendee.user_id,
      });
      if (error) {
        // Refund failed for this attendee
        toast.error("Error refunding attendee");
        return;
      }
    }

    // Now delete the event
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) {
      // Delete failed
      return toast.error(error.message);
    }
    toast("Event deleted and attendees refunded");
    await loadEvents();
    await loadProfiles();
  };

  const adjustCredits = async (id: string, delta: number) => {
    const { error } = await supabase.rpc("admin_update_credits", {
      _user_id: id,
      _delta: delta,
      _note: "manual",
    });
    if (error)
      // Adjust credits failed
      return toast.error(error.message);
    toast(`Credits ${delta > 0 ? "added" : "removed"}`);
    await loadProfiles();
  };

  const viewAttendees = async (eventId: string) => {
    setSelectedEventId(eventId);
    const { data, error } = await supabase
      .from("event_attendees")
      .select("user_id, profiles(name), position")
      .eq("event_id", eventId);

    if (error) return toast.error(error.message);

    const attendees = (data ?? []).map((d: any) => ({
      user_id: d.user_id,
      name: d.profiles?.name || "Unknown",
      position: d.position || "Unknown",
    }));

    setAttendees(attendees);
  };

  const removeAttendee = async (eventId: string, userId: string) => {
    const { error } = await supabase.rpc("admin_remove_attendee", {
      _event_id: eventId,
      _user_id: userId,
    });
    if (error)
      // Remove attendee failed
      return toast.error(error.message);
    toast("Attendee removed and refunded");
    await viewAttendees(eventId);
    await loadEvents();
    await loadProfiles();
  };

  return (
    <main className="relative flex-1 bg-gray-50 bg-background overflow-auto">
      {/* Background image */}
      <div
        className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${alienBg})` }}
      />

      {/* Page content */}
      <section className="relative z-10 container mx-auto px-6 py-12 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-white drop-shadow">
            Admin Dashboard
          </h1>
          <p className="text-white text-opacity-90 drop-shadow">
            Manage events, users, and credits.
          </p>
        </header>

        <Separator className="border-white border-opacity-20" />

        <section className="grid gap-6 md:grid-cols-2">
          {/* Create Event Card */}
          <Card>
            <CardHeader>
              <CardTitle>Create Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col items-start gap-2">
                <label htmlFor="title" className="text-md">
                  Title
                </label>
                <Input
                  name="title"
                  id="title"
                  placeholder="Zib zib ble ble"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label htmlFor="description" className="text-md">
                  Description
                </label>
                <Input
                  name="description"
                  id="description"
                  placeholder="(Optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label htmlFor="date" className="text-md">
                  Date
                </label>
                <Input
                  name="date"
                  id="date"
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col items-start gap-2">
                <label htmlFor="capacity" className="text-md">
                  Capacity
                </label>
                <Input
                  name="capacity"
                  id="capacity"
                  type="number"
                  min="0"
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value || "0"))}
                />
              </div>
              <div className="flex flex-col items-end justify-end w-full">
                <Button
                  onClick={createEvent}
                  disabled={!title || !date || capacity < 1}
                >
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users & Credits Card */}
          <Card>
            <CardHeader>
              <CardTitle>Users & Credits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[375px] overflow-y-auto">
              {loading ? (
                <>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-md w-full mb-2" />
                  ))}
                </>
              ) : profiles.length === 0 ? (
                <p className="text-black">No users.</p>
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
                        variant="outline"
                        onClick={() => adjustCredits(p.id, -1)}
                      >
                        -1
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => adjustCredits(p.id, 1)}
                      >
                        +1
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        {/* Events Section */}
        <section className="space-y-4">
          <h2 className="text-xl font-medium text-black drop-shadow">Events</h2>
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
                      {dayjs(ev.event_date).format("MMM D, YYYY h:mm A")}
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
                        onClick={() => handleDeleteEvent(ev.id)}
                      >
                        <TrashIcon />
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
                              className="flex items-center gap-x-4 justify-between"
                            >
                              <span className="text-sm truncate">
                                {attendee.name}
                              </span>
                              <span className="text-sm capitalize">
                                {attendee.position}
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRemoveAttendee(ev.id, attendee.user_id)
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

      <ConfirmationModal
        open={confirmModalOpen}
        title={confirmModalTitle}
        message={confirmModalMessage}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={confirmModalAction}
        onCancel={() => setConfirmModalOpen(false)}
      />
    </main>
  );
};

export default Admin;
