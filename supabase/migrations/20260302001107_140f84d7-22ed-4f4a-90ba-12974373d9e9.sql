
-- Plans table for admin-managed subscription plans
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  duration_days integer NOT NULL DEFAULT 30,
  features_ar text[] NOT NULL DEFAULT '{}',
  features_en text[] NOT NULL DEFAULT '{}',
  is_popular boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans" ON public.plans
  FOR SELECT USING (is_active = true OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Admins can manage plans" ON public.plans
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- App settings table for configurable values like trial duration
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.app_settings
  FOR ALL USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Insert default trial duration
INSERT INTO public.app_settings (key, value) VALUES ('trial_duration_days', '30');

-- Add is_suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;
