
-- Performance Indexes for all tables

-- profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles (owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles (phone) WHERE phone IS NOT NULL;

-- user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);

-- customers
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers (owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers (phone);
CREATE INDEX IF NOT EXISTS idx_customers_owner_active ON public.customers (owner_id) WHERE is_active = true;

-- debts
CREATE INDEX IF NOT EXISTS idx_debts_owner_id ON public.debts (owner_id);
CREATE INDEX IF NOT EXISTS idx_debts_customer_id ON public.debts (customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_owner_customer ON public.debts (owner_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_debts_created_at ON public.debts (created_at DESC);

-- payments
CREATE INDEX IF NOT EXISTS idx_payments_owner_id ON public.payments (owner_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON public.payments (customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_debt_id ON public.payments (debt_id);
CREATE INDEX IF NOT EXISTS idx_payments_owner_customer ON public.payments (owner_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments (created_at DESC);

-- orders
CREATE INDEX IF NOT EXISTS idx_orders_owner_id ON public.orders (owner_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_owner_status ON public.orders (owner_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);

-- notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- otp_codes
CREATE INDEX IF NOT EXISTS idx_otp_phone ON public.otp_codes (phone);
CREATE INDEX IF NOT EXISTS idx_otp_phone_verified ON public.otp_codes (phone, verified);

-- employee_permissions
CREATE INDEX IF NOT EXISTS idx_emp_perm_employee ON public.employee_permissions (employee_id);
CREATE INDEX IF NOT EXISTS idx_emp_perm_owner ON public.employee_permissions (owner_id);

-- payment_methods
CREATE INDEX IF NOT EXISTS idx_payment_methods_owner ON public.payment_methods (owner_id);
