
-- Create ads table
CREATE TABLE public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  link TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Anyone can read active ads
CREATE POLICY "Anyone can read active ads"
ON public.ads FOR SELECT
USING (is_active = true OR has_role(auth.uid(), 'super_admin'::app_role));

-- Only admins can manage ads
CREATE POLICY "Admins can manage ads"
ON public.ads FOR ALL
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create storage bucket for ad images
INSERT INTO storage.buckets (id, name, public) VALUES ('ads', 'ads', true);

-- Public read access for ad images
CREATE POLICY "Anyone can view ad images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ads');

-- Admins can upload ad images
CREATE POLICY "Admins can upload ad images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ads' AND has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can delete ad images
CREATE POLICY "Admins can delete ad images"
ON storage.objects FOR DELETE
USING (bucket_id = 'ads' AND has_role(auth.uid(), 'super_admin'::app_role));
