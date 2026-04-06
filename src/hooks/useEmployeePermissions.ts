import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const MODULES = [
  "dashboard",
  "customers",
  "debts",
  "payments",
  "orders",
  "reports",
] as const;

export type ModuleKey = (typeof MODULES)[number];

export interface ModulePermission {
  module: ModuleKey;
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export const MODULE_LABELS: Record<ModuleKey, { ar: string; en: string }> = {
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  customers: { ar: "الزبائن", en: "Customers" },
  debts: { ar: "الديون", en: "Debts" },
  payments: { ar: "المدفوعات", en: "Payments" },
  orders: { ar: "الطلبات", en: "Orders" },
  reports: { ar: "التقارير", en: "Reports" },
};

// Map modules to route paths
export const MODULE_ROUTES: Record<ModuleKey, string> = {
  dashboard: "/owner/dashboard",
  customers: "/owner/customers",
  debts: "/owner/debts",
  payments: "/owner/payments",
  orders: "/owner/orders",
  reports: "/owner/reports",
};

// Get the first route the employee has view permission for
export function getFirstAllowedRoute(perms: Record<string, ModulePermission> | undefined): string {
  if (!perms) return "/owner/customers";
  for (const m of MODULES) {
    if (m === "dashboard") continue; // employees don't have dashboard
    if (perms[m]?.can_view && MODULE_ROUTES[m]) return MODULE_ROUTES[m];
  }
  return "/owner/customers";
}

export function defaultPermissions(): ModulePermission[] {
  return MODULES.map((m) => ({
    module: m,
    can_view: false,
    can_add: false,
    can_edit: false,
    can_delete: false,
  }));
}

// Fetch permissions for the currently logged-in employee
export function useMyPermissions() {
  const { user } = useAuth();
  const isEmployee = user?.role === "employee";

  return useQuery({
    queryKey: ["my-permissions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("employee_permissions")
        .select("*")
        .eq("employee_id", user!.id);
      if (error) throw error;
      const perms: Record<string, ModulePermission> = {};
      (data || []).forEach((p: any) => {
        perms[p.module] = {
          module: p.module,
          can_view: p.can_view,
          can_add: p.can_add,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        };
      });
      return perms;
    },
    enabled: isEmployee && !!user?.id,
  });
}

// Check if current user has a specific permission
export function useHasPermission(module: ModuleKey, action: "view" | "add" | "edit" | "delete") {
  const { user } = useAuth();
  const { data: perms } = useMyPermissions();

  if (!user) return false;
  if (user.role === "owner" || user.role === "super_admin") return true;
  if (user.role !== "employee") return false;

  const mp = perms?.[module];
  if (!mp) return false;

  switch (action) {
    case "view": return mp.can_view;
    case "add": return mp.can_add;
    case "edit": return mp.can_edit;
    case "delete": return mp.can_delete;
    default: return false;
  }
}

// Fetch permissions for a specific employee (used by owner)
export function useEmployeePermissions(employeeId: string | null) {
  return useQuery({
    queryKey: ["employee-permissions", employeeId],
    queryFn: async () => {
      if (!employeeId) return [];
      const { data, error } = await supabase
        .from("employee_permissions")
        .select("*")
        .eq("employee_id", employeeId);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!employeeId,
  });
}

// Save permissions for an employee
export function useSaveEmployeePermissions() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      employeeId,
      permissions,
    }: {
      employeeId: string;
      permissions: ModulePermission[];
    }) => {
      // Delete existing permissions
      await supabase
        .from("employee_permissions")
        .delete()
        .eq("employee_id", employeeId)
        .eq("owner_id", user!.id);

      // Insert new permissions (only modules with at least one permission)
      const toInsert = permissions
        .filter((p) => p.can_view || p.can_add || p.can_edit || p.can_delete)
        .map((p) => ({
          employee_id: employeeId,
          owner_id: user!.id,
          module: p.module,
          can_view: p.can_view,
          can_add: p.can_add,
          can_edit: p.can_edit,
          can_delete: p.can_delete,
        }));

      if (toInsert.length > 0) {
        const { error } = await supabase.from("employee_permissions").insert(toInsert);
        if (error) throw error;
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["employee-permissions", vars.employeeId] });
      qc.invalidateQueries({ queryKey: ["my-permissions"] });
    },
  });
}
