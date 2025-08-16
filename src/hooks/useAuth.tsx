import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";
import { toast } from "react-toastify";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>; // added
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(async () => {
          await Promise.all([fetchProfile(), fetchIsAdmin(sess.user.id)]);
        }, 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        await Promise.all([fetchProfile(), fetchIsAdmin(data.session.user.id)]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (!error) setProfile(data);
  };

  const fetchProfile = async () => {
    const { data: userData, error } = await supabase.auth.getUser();
    if (error || !userData.user) {
      toast.error(error?.message || "User not found");
      return;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, name, credits, created_at, updated_at, registered")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (profileError) {
      toast.error(profileError.message);
      return;
    }

    setProfile(data as Profile | null);
  };

  const fetchIsAdmin = async (uid: string) => {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: uid,
      _role: "admin",
    });
    if (error) {
      setIsAdmin(false);
      return;
    }
    setIsAdmin(Boolean(data));
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl, data: { name } },
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast("Check your email to confirm your account.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setIsAdmin(false);
  };

  const updateName = async (name: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ name })
      .eq("id", user.id);
    if (error) {
      toast.error(error.message);
      throw error;
    }
    toast("Profile updated");
    await fetchProfile();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      isAdmin,
      loading,
      signIn,
      signUp,
      signOut,
      updateName,
      refreshProfile,
      resetPassword,
    }),
    [user, session, profile, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
