import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Customer = Database['public']['Tables']['customers']['Row'];
export type ExtendedCustomer = Customer & { firstTransactionDate: string | null };

// --- 1. Owner & Stats Management ---
export function useAdminOwners(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: ["admin-owners", page, pageSize],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_owners_stats" as any, {
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize
      });
      if (!error && data) {
        return (data as any[]).map((p: any) => ({
          ...p,
          stats: {
            customersCount: Number(p.customers_count || 0),
            totalDebts: Number(p.total_debts || 0),
            totalPayments: Number(p.total_payments || 0),
            remainingBalance: Number(p.remaining_balance || 0)
          }
        }));
      }
      const { data: directData, error: directError } = await supabase.from("profiles").select("*").eq("role", "owner").order("created_at", { ascending: false });
      if (directError) throw directError;
      return (directData || []).map((p: any) => ({ ...p, stats: { customersCount: 0, totalDebts: 0, totalPayments: 0, remainingBalance: 0 } }));
    }
  });
}

// --- 2. THE SNIPER PURGE (Final Correct Solution) ---
export function useDeleteOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      console.log("SNIPER PURGE: Targeting profileId:", profileId);
      
      // Step 1: Identify the profile and its user_id
      const { data: targetProfile, error: findError } = await supabase
        .from("profiles")
        .select("user_id, phone, role")
        .eq("id", profileId)
        .single();

      if (findError || !targetProfile) {
        throw new Error("لم يتم العثور على سجل المالك المطلوب.");
      }

      if (targetProfile.role !== 'owner') {
        throw new Error("هذا السجل ليس لمنشأة، لا يمكن حذفه من هنا.");
      }

      const userId = targetProfile.user_id;
      console.log("Found user_id:", userId, "for phone:", targetProfile.phone);

      // Step 2: Purge Business Data (linked by user_id)
      const tables = ["payments", "orders", "debts", "customers", "payment_methods", "admin_requests", "employee_permissions"];
      for (const table of tables) {
        await supabase.from(table as any).delete().eq("owner_id", userId);
      }

      // Step 3: Meta metadata
      await supabase.from("notifications").delete().eq("user_id", userId);
      await supabase.from("fcm_tokens").delete().eq("user_id", userId);
      await supabase.from("user_roles").delete().filter("user_id", "eq", userId).filter("role", "eq", "owner");
      
      if (targetProfile.phone) {
        await supabase.from("otp_codes").delete().eq("phone", targetProfile.phone);
      }

      // Step 4: Employees (They follow the owner's user_id)
      await supabase.from("profiles").delete().eq("owner_id", userId).eq("role", "employee");

      // Step 5: Delete ONLY the OWNER profile row
      const { error: finalDeleteError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);

      if (finalDeleteError) throw finalDeleteError;
      
      console.log("SNIPER PURGE: Success. Business role removed. Customer role preserved if existed.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// ... Rest of the hooks remain unchanged but consistent ...

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats" as any);
      if (!error && data) return data;
      const { data: profiles, error: pError } = await supabase.from("profiles").select("subscription_status").eq("role", "owner");
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

export function useOwnerCustomers(ownerId: string) {
  return useQuery({
    queryKey: ["owner-customers", ownerId],
    queryFn: async (): Promise<ExtendedCustomer[]> => {
      if (!ownerId) return [];
      const { data: customers, error } = await (supabase.from("customers").select("*").eq("owner_id", ownerId).order("name", { ascending: true }) as any);
      if (error) throw error;
      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("customer_id, created_at").eq("owner_id", ownerId),
        supabase.from("payments").select("customer_id, created_at").eq("owner_id", ownerId),
      ]);
      const firstTxMap: Record<string, string> = {};
      [...(debtsRes.data || []), ...(paymentsRes.data || [])].forEach(it => {
        if (!firstTxMap[it.customer_id] || new Date(it.created_at) < new Date(firstTxMap[it.customer_id])) firstTxMap[it.customer_id] = it.created_at;
      });
      return (customers || []).map((c: any) => ({ ...c, firstTransactionDate: firstTxMap[c.id] || null }));
    },
    enabled: !!ownerId,
  });
}

export function useCustomerTransactions(customerId: string) {
  return useQuery({ queryKey: ["customer-transactions", customerId], queryFn: async () => {
    if (!customerId) return [];
    const [d, p] = await Promise.all([supabase.from("debts").select("*").eq("customer_id", customerId), supabase.from("payments").select("*").eq("customer_id", customerId)]);
    return [...(d.data || []).map(x => ({ ...x, type: "debt" })), ...(p.data || []).map(x => ({ ...x, type: "payment" }))].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, enabled: !!customerId });
}

export function useOwnerTransactions(ownerId: string) {
  return useQuery({ queryKey: ["owner-transactions", ownerId], queryFn: async () => {
    if (!ownerId) return [];
    const [d, p] = await Promise.all([supabase.from("debts").select("*, customers(name)").eq("owner_id", ownerId), supabase.from("payments").select("*, customers(name)").eq("owner_id", ownerId)]);
    return [...(d.data || []).map(x => ({ ...x, type: "debt", customer_name: (x as any).customers?.name })), ...(p.data || []).map(x => ({ ...x, type: "payment", customer_name: (x as any).customers?.name }))].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, enabled: !!ownerId });
}

export function useSuspendOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspend }: any) => { await supabase.from("profiles").update({ is_suspended: suspend, is_subscription_active: !suspend, subscription_status: suspend ? "expired" : "active" } as any).eq("user_id", userId).eq("role", "owner"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: any) => { await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: "active" }); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-owners"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
}

export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ subscription_status: "expired", is_subscription_active: false } as any).eq("user_id", userId).eq("role", "owner"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ subscription_status: "active", is_subscription_active: true, is_suspended: false } as any).eq("user_id", userId).eq("role", "owner"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useResetSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: any) => { const now = new Date().toISOString(); await supabase.from("profiles").update({ subscription_status: "expired", is_subscription_active: false, subscription_ends_at: now, trial_ends_at: now } as any).eq("user_id", userId).eq("role", "owner"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useUpdateTrialDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: any) => { await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: days <= 0 ? "expired" : "trial" }); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useCancelTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ trial_ends_at: new Date().toISOString(), subscription_status: "expired", is_subscription_active: false } as any).eq("user_id", userId).eq("role", "owner"); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }),
  });
}

export function useAdminPlans() { return useQuery({ queryKey: ["admin-plans"], queryFn: async () => { const { data, error } = await supabase.from("plans").select("*").order("sort_order"); if (error) throw error; return data || []; } }); }
export function useCreatePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async (p: any) => { await supabase.from("plans").insert(p); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }
export function useUpdatePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...upd }: any) => { await supabase.from("plans").update(upd).eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }
export function useDeletePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { await supabase.from("plans").delete().eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }

export function useAppSettings() { return useQuery({ queryKey: ["app-settings"], queryFn: async () => { const { data, error } = await supabase.from("app_settings").select("*"); if (error) throw error; const s: Record<string, string> = {}; (data || []).forEach((x: any) => { s[x.key] = x.value; }); return s; } }); }
export function useUpdateSetting() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ key, value }: any) => { await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["app-settings"] }) }); }

export function useAdminRequests() { return useQuery({ queryKey: ["admin-requests"], queryFn: async () => { const { data, error } = await supabase.from("admin_requests" as any).select("*, profiles:owner_id(name, business_name, phone)").order("created_at", { ascending: false }); if (error) throw error; return data || []; } }); }
export function useApproveRequest() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ requestId, message }: any) => { await supabase.from("admin_requests" as any).update({ status: "approved", admin_message: message, updated_at: new Date().toISOString() }).eq("id", requestId); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }) }); }
export function useRejectRequest() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ requestId, message }: any) => { await supabase.from("admin_requests" as any).update({ status: "rejected", admin_message: message, updated_at: new Date().toISOString() }).eq("id", requestId); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }) }); }

export const useDeletionRequests = useAdminRequests;
export const useApproveDeletion = useApproveRequest;
export const useRejectDeletion = useRejectRequest;

export function useUpdateAdminAuth() { return useMutation({ mutationFn: async ({ email, password }: any) => { await supabase.auth.updateUser({ email, password }); } }); }

export function useExportOwnerData() {
  return useMutation({
    mutationFn: async ({ ownerId, businessName, prefetchedProfile }: any) => {
      const profile = prefetchedProfile || { business_name: businessName, name: businessName };
      const [cRes, dRes, pRes] = await Promise.all([supabase.from("customers").select("*").eq("owner_id", ownerId), supabase.from("debts").select("*").eq("owner_id", ownerId), supabase.from("payments").select("*").eq("owner_id", ownerId)]);
      const cMap: Record<string, string> = {}; (cRes.data || []).forEach(x => { cMap[x.id] = x.name; });
      const tx = [...(dRes.data || []).map(d => ({ ...d, type: "debt", customer_name: cMap[d.customer_id] || "Unknown" })), ...(pRes.data || []).map(p => ({ ...p, type: "payment", customer_name: cMap[p.customer_id] || "Unknown" }))].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return { profile, customers: cRes.data || [], transactions: tx };
    }
  });
}
