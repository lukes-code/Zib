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
import {
  ChevronDownIcon,
  ChevronRightIcon,
  TrashIcon,
} from "@radix-ui/react-icons";
import ConfirmationModal from "@/components/ui/modal";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin = () => {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(26);
  const [type, setType] = useState("training");
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
    { user_id: string; name: string; position: string; registered: boolean }[]
  >([]);

  const [futureOpen, setFutureOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);

  const registeredUsers = profiles.filter((p) => p.registered);
  const unregisteredUsers = profiles.filter((p) => !p.registered);

  useEffect(() => {
    document.title = "Admin | Pentyrch Aliens";
  }, []);

  const renderUserList = (users: typeof profiles) => {
    if (loading) {
      return [...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-10 rounded-md w-full mb-2" />
      ));
    }

    if (users.length === 0) {
      return <p className="text-black">No users.</p>;
    }

    return users.map((p) => (
      <div key={p.id} className="flex items-center justify-between gap-2">
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
    ));
  };

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, title, description, event_date, capacity, attendees_count, created_by, type"
      )
      .order("event_date", { ascending: true });
    if (error) toast.error(error.message);
    setEvents((data ?? []) as EventItem[]);
  };
  const loadProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, name, credits, registered, created_at, updated_at") // include `registered`
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
    if (!title || !date || (type === "training" && capacity < 1)) return;
    const { error } = await supabase.from("events").insert({
      title,
      description: description || null,
      event_date: new Date(date).toISOString(),
      capacity: type === "training" ? capacity : 1,
      created_by: user?.id ?? null,
      type,
    });
    if (error)
      // Create failed
      return toast.error(error.message);
    toast("Event created");
    setTitle("");
    setDescription("");
    setDate("");
    setCapacity(26);
    setType("training");
    await loadEvents();
  };

  const handleDeleteEvent = (id: string) => {
    setConfirmModalTitle("Delete Event");
    setConfirmModalMessage(
      "Are you sure you want to delete this event? All attendees will be refunded."
    );
    setConfirmModalAction(() => async () => {
      setConfirmModalOpen(false);
      // Call deleteEvent logic here (refunding attendees too)
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

  const now = dayjs();
  const futureEvents = events.filter((ev) => dayjs(ev.event_date).isAfter(now));
  const pastEvents = events.filter((ev) => dayjs(ev.event_date).isBefore(now));

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
      .select("user_id, profiles(name, registered), position")
      .eq("event_id", eventId);

    if (error) return toast.error(error.message);

    const attendees = (data ?? []).map((d: any) => ({
      user_id: d.user_id,
      name: d.profiles?.name || "Unknown",
      position: d.position || "Unknown",
      registered: d.profiles?.registered || false,
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
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto sm:ml-[96px] transition-all duration-300">
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
                <label htmlFor="type" className="text-md">
                  Type
                </label>
                <select
                  name="type"
                  id="type"
                  className="w-full border rounded-md p-2"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="training">Training</option>
                  <option value="game">Game</option>
                </select>
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

              {type === "training" && (
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
                    onChange={(e) =>
                      setCapacity(parseInt(e.target.value || "0"))
                    }
                  />
                </div>
              )}

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
            <CardContent
              className={`space-y-3  overflow-y-auto ${
                type === "training" ? "max-h-[475px]" : "max-h-[400px]"
              }`}
            >
              <Tabs defaultValue="registered" className="w-full">
                <TabsList className="grid grid-cols-2 rounded-xl overflow-hidden border mb-6">
                  <TabsTrigger
                    value="registered"
                    className="bg-white text-gray-700 rounded-[7px] hover:bg-gray-100 data-[state=active]:bg-green-500 data-[state=active]:text-white"
                  >
                    Registered
                  </TabsTrigger>
                  <TabsTrigger
                    value="unregistered"
                    className="bg-white text-gray-700 rounded-[7px] hover:bg-gray-100 data-[state=active]:bg-red-500 data-[state=active]:text-white"
                  >
                    Unregistered
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="registered" className="space-y-5">
                  {renderUserList(registeredUsers)}
                </TabsContent>
                <TabsContent value="unregistered" className="space-y-5">
                  {renderUserList(unregisteredUsers)}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Future Events */}
        <section className="space-y-4">
          <button
            className="flex items-center gap-2 text-lg font-medium"
            onClick={() => setFutureOpen((o) => !o)}
          >
            {futureOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} Future
            Events
          </button>
          {futureOpen &&
            (loading ? (
              [...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : futureEvents.length === 0 ? (
              <p className="text-muted-foreground">No future events.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {futureEvents.map((ev) => (
                  <Card key={ev.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{ev.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        {dayjs(ev.event_date).format("MMM D, YYYY h:mm A")}
                      </p>
                      {ev.type && <p className="text-sm">{ev.type}</p>}
                      {ev.description && (
                        <p className="text-sm">{ev.description}</p>
                      )}
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
                          <div className="flex flex-col">
                            <p className="text-sm font-medium">Attendees</p>
                            <div className="flex space-x-2 items-center py-1">
                              <span className="bg-green-500 p-1 h-2 w-2 rounded-full flex items-center justify-center space-x-2" />
                              <span className="text-xs">Registered</span>
                              <span className="bg-red-500 p-1 h-2 w-2 rounded-full flex items-center justify-center space-x-2" />
                              <span className="text-xs">Unregistered</span>
                            </div>
                            <hr />
                          </div>
                          <div className="max-h-[250px] overflow-y-auto w-full space-2 flex flex-col">
                            {attendees.length === 0 ? (
                              <p className="text-sm text-muted-foreground">
                                No attendees.
                              </p>
                            ) : (
                              attendees.map((a) => (
                                <div
                                  key={a.user_id}
                                  className="flex items-center w-full space-y-2"
                                >
                                  <div className="flex space-x-2 items-center justify-start">
                                    <span
                                      className={`${
                                        a.registered
                                          ? "bg-green-500"
                                          : "bg-red-500"
                                      } p-1 h-2 w-2 rounded-full`}
                                    />
                                    <div className="flex space-x-1 items-center justify-start flex-wrap">
                                      <span className="text-sm">{a.name}</span>
                                      <span className="text-sm capitalize">
                                        {a.position}
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="ml-auto w-full max-w-[150px]"
                                    onClick={() =>
                                      handleRemoveAttendee(ev.id, a.user_id)
                                    }
                                  >
                                    Remove & refund
                                  </Button>
                                  <hr />
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
        </section>

        {/* Past Events */}
        <section className="space-y-4">
          <button
            className="flex items-center gap-2 text-lg font-medium"
            onClick={() => setPastOpen((o) => !o)}
          >
            {pastOpen ? <ChevronDownIcon /> : <ChevronRightIcon />} Past Events
          </button>
          {pastOpen &&
            (loading ? (
              [...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))
            ) : pastEvents.length === 0 ? (
              <p className="text-muted-foreground">No past events.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((ev) => (
                  <Card key={ev.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{ev.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm">
                        {dayjs(ev.event_date).format("MMM D, YYYY h:mm A")}
                      </p>
                      {ev.type && <p className="text-sm">{ev.type}</p>}
                      {ev.description && (
                        <p className="text-sm">{ev.description}</p>
                      )}
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
                            attendees.map((a) => (
                              <div
                                key={a.user_id}
                                className="flex items-center justify-between gap-x-4"
                              >
                                <span className="text-sm">{a.name}</span>
                                <span className="text-sm">{a.position}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleRemoveAttendee(ev.id, a.user_id)
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
            ))}
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
