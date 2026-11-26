CREATE TABLE public.device_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  payload jsonb NOT NULL,
  source text NOT NULL DEFAULT 'bluetooth',
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_messages_user_time ON public.device_messages (user_id, received_at DESC);
GRANT SELECT, INSERT ON public.device_messages TO authenticated;
GRANT ALL ON public.device_messages TO service_role;
ALTER TABLE public.device_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients read own device messages" ON public.device_messages FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Patients add own device messages" ON public.device_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);