DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.waitlist_signups;
CREATE POLICY "Anyone can join the waitlist with a valid email" ON public.waitlist_signups
FOR INSERT TO anon, authenticated
WITH CHECK (
  char_length(email) BETWEEN 3 AND 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);