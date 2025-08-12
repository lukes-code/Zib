-- Harden functions by setting explicit search_path

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION public.prevent_sensitive_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.join_event(_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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
SECURITY DEFINER SET search_path = public
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
SECURITY DEFINER SET search_path = public
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