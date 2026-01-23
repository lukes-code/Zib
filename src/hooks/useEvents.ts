import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { EventItem } from "@/types";
import { toast } from "react-toastify";

type UseEventsReturn = {
  events: EventItem[];
  loading: boolean;
  loadEvents: () => Promise<void>;
  loadFutureEvents: () => Promise<void>;
  loadPastEvents: () => Promise<void>;
};

export const useEvents = (): UseEventsReturn => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, event_date, capacity, attendees_count, created_by, type",
        )
        .order("event_date", { ascending: true });

      if (error) {
        toast.error(error.message);
        setEvents([]);
      } else {
        setEvents((data ?? []) as EventItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFutureEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, event_date, capacity, attendees_count, created_by, type",
        )
        .gte("event_date", new Date().toISOString())
        .order("event_date", { ascending: true });

      if (error) {
        toast.error(error.message);
        setEvents([]);
      } else {
        setEvents((data ?? []) as EventItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPastEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, event_date, capacity, attendees_count, created_by, type",
        )
        .lt("event_date", new Date().toISOString())
        .order("event_date", { ascending: false });

      if (error) {
        toast.error(error.message);
        setEvents([]);
      } else {
        setEvents((data ?? []) as EventItem[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    loadEvents,
    loadFutureEvents,
    loadPastEvents,
  };
};
