
-- Payment methods table for owners (wallets, banks, cash)
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('wallet', 'bank', 'cash')),
  provider text NOT NULL,
  account_name text,
  account_number text,
  point_number text,
  phone_number text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can manage their payment methods"
ON public.payment_methods FOR ALL
USING (owner_id = auth.uid());

CREATE POLICY "Customers can read owner payment methods"
ON public.payment_methods FOR SELECT
USING (owner_id IN (SELECT get_owner_ids_for_customer(auth.uid())));

-- Orders table
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id),
  owner_id uuid NOT NULL,
  type text NOT NULL CHECK (type IN ('debt_request', 'payment_request')),
  amount numeric NOT NULL DEFAULT 0,
  description text,
  image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  payment_method_type text,
  payment_method_provider text,
  transaction_number text,
  sender_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processed_by uuid
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Owners can read/update orders for their business
CREATE POLICY "Owners can read their orders"
ON public.orders FOR SELECT
USING (owner_id = auth.uid());

CREATE POLICY "Owners can update their orders"
ON public.orders FOR UPDATE
USING (owner_id = auth.uid());

-- Employees can read/update owner orders
CREATE POLICY "Employees can read owner orders"
ON public.orders FOR SELECT
USING (owner_id IN (SELECT p.owner_id FROM profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL));

CREATE POLICY "Employees can update owner orders"
ON public.orders FOR UPDATE
USING (owner_id IN (SELECT p.owner_id FROM profiles p WHERE p.user_id = auth.uid() AND p.owner_id IS NOT NULL));

-- Customers can insert orders for their businesses
CREATE POLICY "Customers can insert orders"
ON public.orders FOR INSERT
WITH CHECK (customer_id IN (SELECT get_customer_ids_for_user(auth.uid())));

-- Customers can read their own orders
CREATE POLICY "Customers can read own orders"
ON public.orders FOR SELECT
USING (customer_id IN (SELECT get_customer_ids_for_user(auth.uid())));
