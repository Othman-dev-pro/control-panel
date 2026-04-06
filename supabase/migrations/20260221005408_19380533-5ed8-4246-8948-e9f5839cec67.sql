-- Add debt_limit column to customers table
ALTER TABLE public.customers ADD COLUMN debt_limit numeric DEFAULT NULL;

-- Create storage bucket for debt images
INSERT INTO storage.buckets (id, name, public) VALUES ('debt-images', 'debt-images', true);

-- Storage policies for debt images
CREATE POLICY "Anyone can view debt images" ON storage.objects FOR SELECT USING (bucket_id = 'debt-images');
CREATE POLICY "Authenticated users can upload debt images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'debt-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own debt images" ON storage.objects FOR DELETE USING (bucket_id = 'debt-images' AND auth.role() = 'authenticated');