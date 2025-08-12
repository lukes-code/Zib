-- 1) app_role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) user_roles table + RLS
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) has_role function (after table exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 4) RLS for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5) profiles table + triggers + policies
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_profiles_credits ON public.profiles (credits);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data ->> 'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Users cannot change their email';
    END IF;
    -- IF NEW.credits IS DISTINCT FROM OLD.credits THEN
    --   RAISE EXCEPTION 'Users cannot change credits';
    -- END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER prevent_sensitive_profile_changes
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_sensitive_profile_changes();

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6) events table + policies
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity > 0),
  attendees_count integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Authenticated users can view events"
  ON public.events FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins manage events"
  ON public.events FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7) event_attendees table + RLS (read-only; writes via RPC)
CREATE TABLE IF NOT EXISTS public.event_attendees (
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own attendance"
  ON public.event_attendees FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all attendance"
  ON public.event_attendees FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 8) transaction_type enum
DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('credit_grant','credit_revoke','join_event','refund_event');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9) transactions table + RLS
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  amount integer NOT NULL CHECK (amount <> 0),
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 10) Atomic RPCs and grants
CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_credits integer;
  v_capacity integer;
  v_count integer;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT capacity, attendees_count INTO v_capacity, v_count
  FROM public.events
  WHERE id = _event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found';
  END IF;

  IF EXISTS(SELECT 1 FROM public.event_attendees WHERE event_id=_event_id AND user_id=v_user) THEN
    RAISE EXCEPTION 'Already joined';
  END IF;

  SELECT credits INTO v_credits FROM public.profiles WHERE id = v_user FOR UPDATE;
  IF v_credits IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  IF v_credits < 1 THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  IF v_count >= v_capacity THEN
    RAISE EXCEPTION 'Event full';
  END IF;

  UPDATE public.profiles SET credits = credits - 1 WHERE id = v_user;
  INSERT INTO public.event_attendees(event_id, user_id) VALUES (_event_id, v_user);
  UPDATE public.events SET attendees_count = attendees_count + 1 WHERE id = _event_id;

  INSERT INTO public.transactions(user_id, event_id, type, amount, metadata)
  VALUES (v_user, _event_id, 'join_event', -1, jsonb_build_object('reason','join'));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_remove_attendee(_event_id uuid, _user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can remove attendees';
  END IF;

  IF NOT EXISTS(SELECT 1 FROM public.event_attendees WHERE event_id=_event_id AND user_id=_user_id) THEN
    RAISE EXCEPTION 'Attendance not found';
  END IF;

  DELETE FROM public.event_attendees WHERE event_id=_event_id AND user_id=_user_id;
  UPDATE public.events SET attendees_count = attendees_count - 1 WHERE id = _event_id;
  UPDATE public.profiles SET credits = credits + 1 WHERE id = _user_id;

  INSERT INTO public.transactions(user_id, event_id, type, amount, metadata)
  VALUES (_user_id, _event_id, 'refund_event', 1, jsonb_build_object('reason','admin_remove'));
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_user_credits(_user_id uuid, _delta integer, _note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update credits';
  END IF;

  UPDATE public.profiles
  SET credits = credits + _delta
  WHERE id = _user_id;

  IF _delta > 0 THEN
    INSERT INTO public.transactions(user_id, type, amount, metadata)
    VALUES (_user_id, 'credit_grant', _delta, jsonb_build_object('note', _note));
  ELSIF _delta < 0 THEN
    INSERT INTO public.transactions(user_id, type, amount, metadata)
    VALUES (_user_id, 'credit_revoke', _delta, jsonb_build_object('note', _note));
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_remove_attendee(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_user_credits(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;