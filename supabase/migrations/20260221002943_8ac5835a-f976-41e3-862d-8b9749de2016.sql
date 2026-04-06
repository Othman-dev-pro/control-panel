
-- Drop the problematic policies
DROP POLICY IF EXISTS "Customers can read own customer records" ON public.customers;
DROP POLICY IF EXISTS "Customers can read own debts" ON public.debts;
DROP POLICY IF EXISTS "Customers can read own payments" ON public.payments;
DROP POLICY IF EXISTS "Customers can read owner profiles" ON public.profiles;

-- Create security definer function to get customer IDs for a user
CREATE OR REPLACE FUNCTION public.get_customer_ids_for_user(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE user_id = _user_id;
$$;

-- Create security definer function to get owner IDs for a customer user
CREATE OR REPLACE FUNCTION public.get_owner_ids_for_customer(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.customers WHERE user_id = _user_id;
$$;

-- Recreate policies using security definer functions
CREATE POLICY "Customers can read own customer records"
ON public.customers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Customers can read own debts"
ON public.debts FOR SELECT
TO authenticated
USING (customer_id IN (SELECT public.get_customer_ids_for_user(auth.uid())));

CREATE POLICY "Customers can read own payments"
ON public.payments FOR SELECT
TO authenticated
USING (customer_id IN (SELECT public.get_customer_ids_for_user(auth.uid())));

CREATE POLICY "Customers can read owner profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (user_id IN (SELECT public.get_owner_ids_for_customer(auth.uid())));
