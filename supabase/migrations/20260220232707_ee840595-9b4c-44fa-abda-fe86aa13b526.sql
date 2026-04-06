
-- Fix overly permissive notifications INSERT policy
DROP POLICY "Authenticated can insert notifications" ON public.notifications;

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (user_id IS NOT NULL);
