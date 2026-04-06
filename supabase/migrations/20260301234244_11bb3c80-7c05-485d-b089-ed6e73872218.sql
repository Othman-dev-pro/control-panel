-- Add is_active column to customers table
ALTER TABLE public.customers ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Update RLS: customers can only see active links
DROP POLICY IF EXISTS "Customers can read own customer records" ON public.customers;
CREATE POLICY "Customers can read own customer records"
ON public.customers FOR SELECT
USING (user_id = auth.uid() AND is_active = true);