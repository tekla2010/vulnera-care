-- ============================================================
-- Vulnera patient app: profiles, readings, alerts, waitlist
-- ============================================================

-- ---------- Patient profile ----------
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT '',
  wound_location TEXT NOT NULL DEFAULT '',
  care_team TEXT NOT NULL DEFAULT '',
  clinic TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read their own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can add their own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can change their own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can delete their own profile"
  ON public.profiles FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- Wound readings ----------
CREATE TABLE public.readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  temp_c NUMERIC(4,1) NOT NULL,
  ph NUMERIC(4,2) NOT NULL,
  moisture NUMERIC(5,1) NOT NULL,
  healing_score INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'watch', 'alert')),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX readings_user_time_idx ON public.readings (user_id, recorded_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.readings TO authenticated;
GRANT ALL ON public.readings TO service_role;

ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read their own readings"
  ON public.readings FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can add their own readings"
  ON public.readings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can change their own readings"
  ON public.readings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can delete their own readings"
  ON public.readings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- Alerts ----------
CREATE TABLE public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('healthy', 'watch', 'alert')),
  title TEXT NOT NULL,
  action TEXT NOT NULL,
  contact_doctor BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX alerts_user_time_idx ON public.alerts (user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can read their own alerts"
  ON public.alerts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Patients can add their own alerts"
  ON public.alerts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can change their own alerts"
  ON public.alerts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Patients can delete their own alerts"
  ON public.alerts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ---------- Waitlist sign-ups (landing page) ----------
CREATE TABLE public.waitlist_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.waitlist_signups TO anon, authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;

ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the waitlist"
  ON public.waitlist_signups FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- ---------- Auto-create a profile when someone registers ----------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
