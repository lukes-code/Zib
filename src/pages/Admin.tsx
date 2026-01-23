import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Profile } from "@/types";
import alienBg from "@/assets/images/ufo.jpg";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDownIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import ConfirmationModal from "@/components/ui/modal";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventForm } from "@/components/forms/EventForm";
import { EventCard } from "@/components/EventCard";
import { UserList } from "@/components/UserList";
import { AttendeesList } from "@/components/AttendeesList";
import { useEvents } from "@/hooks/useEvents";
import { useProfiles } from "@/hooks/useProfiles";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";

type AttendeeData = {
  user_id: string;
  profiles: { name: string | null; registered: boolean } | null;
  position: string | null;
};

const Admin = () => {
  const { user } = useAuth();
  const { events, loading: eventsLoading, loadEvents } = useEvents();
  const { profiles, loading: profilesLoading, loadProfiles } = useProfiles();
  const {
    state: confirmModalState,
    openConfirmation,
    closeConfirmation,
  } = useConfirmationModal();

  // Local profiles state for optimistic updates
  const [localProfiles, setLocalProfiles] = useState<Profile[]>([]);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [capacity, setCapacity] = useState(26);
  const [type, setType] = useState("training");

  // UI state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [attendees, setAttendees] = useState<
    { user_id: string; name: string; position: string; registered: boolean }[]
  >([]);
  const [futureOpen, setFutureOpen] = useState(true);
  const [pastOpen, setPastOpen] = useState(false);

  const loading = eventsLoading || profilesLoading;

  // Sync profiles from hook to local state when they change
  useEffect(() => {
    setLocalProfiles(profiles);
  }, [profiles]);

  const registeredUsers = localProfiles.filter((p) => p.registered);
  const unregisteredUsers = localProfiles.filter((p) => !p.registered);

  useEffect(() => {
    document.title = "Admin | Pentyrch Aliens";
    loadEvents();
    loadProfiles();
  }, [loadEvents, loadProfiles]);

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
    if (error) return toast.error(error.message);
    toast("Event created");
    setTitle("");
    setDescription("");
    setDate("");
    setCapacity(26);
    setType("training");
    await loadEvents();
  };

  const toggleRegistered = async (id: string, current: boolean) => {
    // Optimistic update
    setLocalProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, registered: !current } : p)),
    );

    const { error } = await supabase.rpc("admin_update_registered", {
      _user_id: id,
      _registered: !current,
    });
    if (error) {
      // Revert on error
      setLocalProfiles((prev) =>
        prev.map((p) => (p.id === id ? { ...p, registered: current } : p)),
      );
      return toast.error(error.message);
    }
    toast(`User ${!current ? "registered" : "unregistered"}`);
  };

  const adjustCredits = async (id: string, delta: number) => {
    // Optimistic update
    setLocalProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, credits: p.credits + delta } : p)),
    );

    const { error } = await supabase.rpc("admin_update_credits", {
      _user_id: id,
      _delta: delta,
      _note: "manual",
    });
    if (error) {
      // Revert on error
      setLocalProfiles((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, credits: p.credits - delta } : p,
        ),
      );
      return toast.error(error.message);
    }
    toast(`Credits ${delta > 0 ? "added" : "removed"}`);
  };

  const handleDeleteEvent = (id: string) => {
    openConfirmation(
      "Delete Event",
      "Are you sure you want to delete this event? All attendees will be refunded.",
      async () => {
        await deleteEvent(id);
      },
    );
  };

  const deleteEvent = async (id: string) => {
    const { data: attendeesData, error: attendeesError } = await supabase
      .from("event_attendees")
      .select("user_id")
      .eq("event_id", id);

    if (attendeesError) {
      toast.error(attendeesError.message);
      return;
    }

    for (const attendee of attendeesData ?? []) {
      const { error } = await supabase.rpc("admin_remove_attendee", {
        _event_id: id,
        _user_id: attendee.user_id,
      });
      if (error) {
        toast.error("Error refunding attendee");
        return;
      }
    }

    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);

    toast("Event deleted and attendees refunded");
    await loadEvents();
    await loadProfiles();
  };

  const viewAttendees = async (eventId: string) => {
    setSelectedEventId(eventId);
    const { data, error } = await supabase
      .from("event_attendees")
      .select("user_id, profiles(name, registered), position")
      .eq("event_id", eventId);

    if (error) return toast.error(error.message);

    const attendeesData = (data ?? ([] as AttendeeData[])).map((d) => ({
      user_id: d.user_id,
      name: d.profiles?.name || "Unknown",
      position: d.position || "Unknown",
      registered: d.profiles?.registered || false,
    }));

    setAttendees(attendeesData);
  };

  const handleRemoveAttendee = (eventId: string, userId: string) => {
    openConfirmation(
      "Remove Attendee",
      "Are you sure you want to remove this attendee and refund their credit?",
      async () => {
        await removeAttendee(eventId, userId);
      },
    );
  };

  const removeAttendee = async (eventId: string, userId: string) => {
    const { error } = await supabase.rpc("admin_remove_attendee", {
      _event_id: eventId,
      _user_id: userId,
    });
    if (error) return toast.error(error.message);
    toast("Attendee removed and refunded");
    await viewAttendees(eventId);
    await loadEvents();
    await loadProfiles();
  };

  const now = dayjs();
  const futureEvents = events.filter((ev) => dayjs(ev.event_date).isAfter(now));
  const pastEvents = events.filter((ev) => dayjs(ev.event_date).isBefore(now));

  return (
    <main className="relative bg-gray-50 flex-1 bg-background overflow-auto sm:ml-[96px] transition-all duration-300">
      <div
        className="absolute top-0 left-0 w-full h-[400px] bg-cover bg-center"
        style={{ backgroundImage: `url(${alienBg})` }}
      />

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

        {/* Create Event & User Management */}
        <section className="grid gap-6 md:grid-cols-2">
          <EventForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            date={date}
            setDate={setDate}
            type={type}
            setType={setType}
            capacity={capacity}
            setCapacity={setCapacity}
            onSubmit={createEvent}
          />

          {/* Users & Credits */}
          <Card>
            <CardHeader>
              <CardTitle>Users & Credits</CardTitle>
            </CardHeader>
            <CardContent
              className={`space-y-3 overflow-y-auto ${
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
                  <UserList
                    users={registeredUsers}
                    loading={loading}
                    onAdjustCredits={adjustCredits}
                    onToggleRegistered={toggleRegistered}
                  />
                </TabsContent>
                <TabsContent value="unregistered" className="space-y-5">
                  <UserList
                    users={unregisteredUsers}
                    loading={loading}
                    onAdjustCredits={adjustCredits}
                    onToggleRegistered={toggleRegistered}
                  />
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
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onDelete={handleDeleteEvent}
                    onViewAttendees={viewAttendees}
                  >
                    {selectedEventId === ev.id && (
                      <div className="pt-4">
                        <AttendeesList
                          attendees={attendees}
                          onRemove={(userId) =>
                            handleRemoveAttendee(ev.id, userId)
                          }
                        />
                      </div>
                    )}
                  </EventCard>
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
                  <EventCard
                    key={ev.id}
                    event={ev}
                    onDelete={handleDeleteEvent}
                    onViewAttendees={viewAttendees}
                  >
                    {selectedEventId === ev.id && (
                      <div className="pt-4">
                        <AttendeesList
                          attendees={attendees}
                          onRemove={(userId) =>
                            handleRemoveAttendee(ev.id, userId)
                          }
                        />
                      </div>
                    )}
                  </EventCard>
                ))}
              </div>
            ))}
        </section>
      </section>

      <ConfirmationModal
        open={confirmModalState.open}
        title={confirmModalState.title}
        message={confirmModalState.message}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        onConfirm={async () => {
          await confirmModalState.action();
          closeConfirmation();
        }}
        onCancel={closeConfirmation}
      />
    </main>
  );
};

export default Admin;
