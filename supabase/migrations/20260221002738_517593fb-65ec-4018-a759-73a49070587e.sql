
-- Allow customers to read their own customer records
CREATE POLICY "Customers can read own customer records"
ON public.customers FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow customers to read their own debts
CREATE POLICY "Customers can read own debts"
ON public.debts FOR SELECT
TO authenticated
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Allow customers to read their own payments
CREATE POLICY "Customers can read own payments"
ON public.payments FOR SELECT
TO authenticated
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Allow customers to read owner profiles (for business names)
CREATE POLICY "Customers can read owner profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT owner_id FROM public.customers WHERE user_id = auth.uid()
  )
);
