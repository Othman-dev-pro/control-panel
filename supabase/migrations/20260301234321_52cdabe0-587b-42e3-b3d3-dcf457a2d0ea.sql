-- Update get_customer_ids_for_user to only return active customers
CREATE OR REPLACE FUNCTION public.get_customer_ids_for_user(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.customers WHERE user_id = _user_id AND is_active = true;
$$;

-- Update get_owner_ids_for_customer to only return active links
CREATE OR REPLACE FUNCTION public.get_owner_ids_for_customer(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_id FROM public.customers WHERE user_id = _user_id AND is_active = true;
$$;