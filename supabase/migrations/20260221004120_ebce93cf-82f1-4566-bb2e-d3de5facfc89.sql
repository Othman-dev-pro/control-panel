
-- Create a SECURITY DEFINER function to look up a customer user_id by phone
-- This bypasses RLS so owners can auto-link customers during creation
CREATE OR REPLACE FUNCTION public.find_customer_user_by_phone(_phone text)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON ur.user_id = p.user_id
  WHERE ur.role = 'customer'
    AND (p.phone = _phone OR p.phone = regexp_replace(_phone, '\D', '', 'g'))
  LIMIT 1;
$$;
