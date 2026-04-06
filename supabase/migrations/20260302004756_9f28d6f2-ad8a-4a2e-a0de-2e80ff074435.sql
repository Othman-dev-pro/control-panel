
-- Add scheduling columns to ads table
ALTER TABLE public.ads ADD COLUMN starts_at TIMESTAMP WITH TIME ZONE DEFAULT now();
ALTER TABLE public.ads ADD COLUMN ends_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
