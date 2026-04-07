import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// --- Owner Management ---
export function useAdminOwners(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: ["admin-owners", page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_owners_stats" as any, {
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize
      });
      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          stats: {
            customersCount: Number(p.customers_count || 0),
            totalDebts: Number(p.total_debts || 0),
            totalPayments: Number(p.total_payments || 0),
            remainingBalance: Number(p.remaining_balance || 0)
          }
        }));
      }
      const { data: directData, error: directError } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (directError) throw directError;
      return (directData || []).map((p: any) => ({ ...p, stats: { customersCount: 0, totalDebts: 0, totalPayments: 0, remainingBalance: 0 } }));
    }
  });
}

export function useOwnerCustomers(ownerId: string) {
  return useQuery({
    queryKey: ["owner-customers", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data: customers, error: customerError } = await supabase.from("customers").select("*").eq("owner_id", ownerId).order("name", { ascending: true });
      if (customerError) throw customerError;

      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("customer_id, created_at").eq("owner_id", ownerId),
        supabase.from("payments").select("customer_id, created_at").eq("owner_id", ownerId),
      ]);

      const firstTxMap: Record<string, string> = {};
      const processDates = (items: any[]) => {
        items.forEach(item => {
          const cid = item.customer_id;
          if (!firstTxMap[cid] || new Date(item.created_at) < new Date(firstTxMap[cid])) {
            firstTxMap[cid] = item.created_at;
          }
        });
      };
      processDates(debtsRes.data || []);
      processDates(paymentsRes.data || []);

      return (customers || []).map(c => ({
        ...c,
        firstTransactionDate: firstTxMap[c.id] || null
      }));
    },
    enabled: !!ownerId,
  });
}

export function useCustomerTransactions(customerId: string) {
  return useQuery({
    queryKey: ["customer-transactions", customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("*").eq("customer_id", customerId),
        supabase.from("payments").select("*").eq("customer_id", customerId),
      ]);
      const transactions = [
        ...(debtsRes.data || []).map(d => ({ ...d, type: "debt" })),
        ...(paymentsRes.data || []).map(p => ({ ...p, type: "payment" }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return transactions;
    },
    enabled: !!customerId,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats" as any);
      if (!error && data) return data;
      const { data: profiles, error: pError } = await supabase.from("profiles").select("subscription_status");
      if (pError) throw pError;
      return {
        totalOwners: (profiles || []).length,
        activeSubscriptions: (profiles || []).filter(p => p.subscription_status === 'active').length,
        totalCustomers: 0,
        totalRevenue: 0,
      };
    }
  });
}

// --- Hard Purge Engine ---
export function useDeleteOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      const tablesToDelete = [
        { name: "notifications", field: "user_id" },
        { name: "fcm_tokens", field: "user_id" },
        { name: "otp_codes", field: "owner_id" },
        { name: "ads", field: "owner_id" },
        { name: "payments", field: "owner_id" },
        { name: "orders", field: "owner_id" },
        { name: "debts", field: "owner_id" },
        { name: "customers", field: "owner_id" },
        { name: "payment_methods", field: "owner_id" },
        { name: "admin_requests", field: "owner_id" },
        { name: "employee_permissions", field: "owner_id" },
        { name: "user_roles", field: "user_id" }
      ];

      for (const table of tablesToDelete) {
        await supabase.from(table.name as any).delete().eq(table.field, userId);
      }

      await supabase.from("profiles").delete().eq("owner_id", userId);
      const { error, count } = await supabase.from("profiles").delete({ count: "exact" }).eq("user_id", userId);
      if (error) throw error;
      if (count === 0) throw new Error("سجل المنشأة غير موجود.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// --- Subscriptions ---
export function useSuspendOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase.from("profiles").update({ is_suspended: suspend, is_subscription_active: !suspend, subscription_status: suspend ? "expired" : "active" }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const { error } = await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: "active" });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-owners"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function useUpdateTrialDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      const { error } = await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: days <= 0 ? "expired" : "trial" });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

// --- Exports ---
export function useExportOwnerData() {
  return useMutation({
    mutationFn: async ({ ownerId, businessName, prefetchedProfile }: { ownerId: string; businessName: string; prefetchedProfile?: any }) => {
      const profile = prefetchedProfile || { business_name: businessName, name: businessName };
      const { data: customers } = await supabase.from("customers").select("*").eq("owner_id", ownerId);
      const [debtsRes, paymentsRes] = await Promise.all([supabase.from("debts").select("*").eq("owner_id", ownerId), supabase.from("payments").select("*").eq("owner_id", ownerId)]);
      const customerMap: Record<string, string> = {};
      (customers || []).forEach(c => { customerMap[c.id] = c.name; });
      const transactions = [
        ...(debtsRes.data || []).map(d => ({ ...d, type: "debt", customer_name: customerMap[d.customer_id] || "Unknown" })),
        ...(paymentsRes.data || []).map(p => ({ ...p, type: "payment", customer_name: customerMap[p.customer_id] || "Unknown" }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { profile, customers: customers || [], transactions };
    }
  });
}

// --- Transactions for UI ---
export function useOwnerTransactions(ownerId: string) {
  return useQuery({
    queryKey: ["owner-transactions", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("*, customers(name)").eq("owner_id", ownerId),
        supabase.from("payments").select("*, customers(name)").eq("owner_id", ownerId),
      ]);
      const transactions = [
        ...(debtsRes.data || []).map(d => ({ ...d, type: "debt", customer_name: (d as any).customers?.name })),
        ...(paymentsRes.data || []).map(p => ({ ...p, type: "payment", customer_name: (p as any).customers?.name }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return transactions;
    },
    enabled: !!ownerId,
  });
}

// --- Plans & Settings ---
export function useAdminPlans() {
  return useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase.from("plans").select("*").order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useAppSettings() {
  return useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("*");
      if (error) throw error;
      const settings: Record<string, string> = {};
      (data || []).forEach((s: any) => { settings[s.key] = s.value; });
      return settings;
    },
  });
}

export function useAdminRequests() {
  return useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_requests" as any).select("*, profiles:owner_id(name, business_name, phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ownerId, type, message }: { requestId: string; ownerId: string; type: string; message: string }) => {
      await supabase.from("admin_requests" as any).update({ status: "rejected", admin_message: message }).eq("id", requestId);
      await supabase.from("notifications").insert({ user_id: ownerId, title: "تحديث الطلب", message: message || "تم رفض طلبك.", type: "info" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }),
  });
}
