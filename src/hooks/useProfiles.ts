import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import { toast } from "react-toastify";

type UseProfilesReturn = {
  profiles: Profile[];
  loading: boolean;
  loadProfiles: () => Promise<void>;
  refreshProfiles: () => Promise<void>;
};

export const useProfiles = (): UseProfilesReturn => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, name, credits, registered, created_at, updated_at, subscribed",
        )
        .order("created_at", { ascending: false });

      if (error) {
        toast.error(error.message);
        setProfiles([]);
      } else {
        setProfiles((data ?? []) as Profile[]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfiles = useCallback(async () => {
    await loadProfiles();
  }, [loadProfiles]);

  return {
    profiles,
    loading,
    loadProfiles,
    refreshProfiles,
  };
};
