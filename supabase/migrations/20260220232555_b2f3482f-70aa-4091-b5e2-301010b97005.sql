
-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT,
  username TEXT,
  email TEXT,
  owner_id UUID,
  business_name TEXT,
  subscription_status TEXT NOT NULL DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired')),
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  subscription_ends_at TIMESTAMP WITH TIME ZONE,
  is_subscription_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can read all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Owners can read their employees profiles"
ON public.profiles FOR SELECT TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can insert own profile"
ON public.profiles FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    NEW.email,
    NEW.phone
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();

-- Customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their customers"
ON public.customers FOR ALL TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Employees can read owner customers"
ON public.customers FOR SELECT TO authenticated
USING (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Employees can insert for owner"
ON public.customers FOR INSERT TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Super admins can read all customers"
ON public.customers FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Debts table
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  image_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their debts"
ON public.debts FOR ALL TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Employees can read owner debts"
ON public.debts FOR SELECT TO authenticated
USING (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Employees can insert debts for owner"
ON public.debts FOR INSERT TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Super admins can read all debts"
ON public.debts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE NOT NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their payments"
ON public.payments FOR ALL TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Employees can read owner payments"
ON public.payments FOR SELECT TO authenticated
USING (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Employees can insert payments for owner"
ON public.payments FOR INSERT TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT p.owner_id FROM public.profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL
  )
);

CREATE POLICY "Super admins can read all payments"
ON public.payments FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- Notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  related_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Authenticated can insert notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- Update the admin profile that was already created
UPDATE public.profiles 
SET name = 'مدير النظام', email = 'othmanalhammadi.dev@gmail.com'
WHERE user_id = '0f06f2f1-427b-459c-bc65-e3c4d29107d3';

-- Function to get owner_id for current user (for employees)
CREATE OR REPLACE FUNCTION public.get_effective_owner_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id FROM public.profiles WHERE user_id = auth.uid() AND owner_id IS NOT NULL),
    auth.uid()
  )
$$;
