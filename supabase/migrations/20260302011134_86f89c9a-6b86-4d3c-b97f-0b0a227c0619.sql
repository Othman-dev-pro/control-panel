
-- Employee permissions table
CREATE TABLE public.employee_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  module text NOT NULL,
  can_view boolean NOT NULL DEFAULT false,
  can_add boolean NOT NULL DEFAULT false,
  can_edit boolean NOT NULL DEFAULT false,
  can_delete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, module)
);

ALTER TABLE public.employee_permissions ENABLE ROW LEVEL SECURITY;

-- Owners can manage permissions for their employees
CREATE POLICY "Owners can manage employee permissions"
ON public.employee_permissions
FOR ALL
USING (owner_id = auth.uid());

-- Employees can read their own permissions
CREATE POLICY "Employees can read own permissions"
ON public.employee_permissions
FOR SELECT
USING (employee_id = auth.uid());

-- Super admins can read all
CREATE POLICY "Super admins can read all permissions"
ON public.employee_permissions
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));
