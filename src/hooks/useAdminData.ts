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
      // Auto-trigger the update for expired subscriptions before fetching
      await (supabase.rpc as any)("update_expired_subscriptions");
      
      const { data, error } = await (supabase.rpc as any)("get_admin_owners_stats", {
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
      const { data: directData, error: dError } = await supabase.from("profiles").select("*").eq("role" as any, "owner" as any).order("created_at", { ascending: false });
      if (dError) throw dError;
      return (directData || []).map((p: any) => ({ ...p, stats: { customersCount: 0, totalDebts: 0, totalPayments: 0, remainingBalance: 0 } }));
    }
  });
}

// --- 2. THE HARD PURGE (Final RPC Solution) ---
export function useDeleteOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profileId: string) => {
      console.log("HARD PURGE: Calling RPC for profileId:", profileId);
      
      // Step: Execute the high-privilege server-side function
      const { error } = await (supabase.rpc as any)("hard_purge_owner", {
        p_identifier: profileId.toString()
      });

      if (error) {
        console.error("RPC Purge Error:", error);
        throw new Error(error.message || "فشل الحذف الجذري للمنشأة.");
      }

      console.log("HARD PURGE: Success via RPC.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// --- 3. Rest of Administrative hooks ---
export function useAdminStats() {
  return useQuery({ queryKey: ["admin-stats"], queryFn: async () => {
    const { data, error } = await supabase.rpc("get_admin_dashboard_stats" as any);
    if (!error && data) return data;
    const { data: p, error: pe } = await supabase.from("profiles").select("subscription_status").eq("role" as any, "owner" as any);
    if (pe) throw pe;
    return { totalOwners: (p || []).length, activeSubscriptions: (p || []).filter(x => x.subscription_status === 'active').length, totalCustomers: 0, totalRevenue: 0 };
  }});
}

export function useOwnerCustomers(ownerId: string) { return useQuery({ queryKey: ["owner-customers", ownerId], queryFn: async (): Promise<ExtendedCustomer[]> => { if (!ownerId) return []; const { data: c, error: ce } = await (supabase.from("customers").select("*").eq("owner_id", ownerId).order("name", { ascending: true }) as any); if (ce) throw ce; const [dr, pr] = await Promise.all([supabase.from("debts").select("customer_id, created_at").eq("owner_id", ownerId), supabase.from("payments").select("customer_id, created_at").eq("owner_id", ownerId)]); const m: Record<string, string> = {}; [...(dr.data || []), ...(pr.data || [])].forEach(it => { if (!m[it.customer_id] || new Date(it.created_at) < new Date(m[it.customer_id])) m[it.customer_id] = it.created_at; }); return (c || []).map((x: any) => ({ ...x, firstTransactionDate: m[x.id] || null })); }, enabled: !!ownerId }); }
export function useCustomerTransactions(customerId: string) { return useQuery({ queryKey: ["customer-transactions", customerId], queryFn: async () => { if (!customerId) return []; const [d, p] = await Promise.all([supabase.from("debts").select("*").eq("customer_id", customerId), supabase.from("payments").select("*").eq("customer_id", customerId)]); return [...(d.data || []).map(x => ({ ...x, type: "debt" })), ...(p.data || []).map(x => ({ ...x, type: "payment" }))].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); }, enabled: !!customerId }); }
export function useOwnerTransactions(ownerId: string) { return useQuery({ queryKey: ["owner-transactions", ownerId], queryFn: async () => { if (!ownerId) return []; const [d, p] = await Promise.all([supabase.from("debts").select("*, customers(name)").eq("owner_id", ownerId), supabase.from("payments").select("*, customers(name)").eq("owner_id", ownerId)]); return [...(d.data || []).map(x => ({ ...x, type: "debt", customer_name: (x as any).customers?.name })), ...(p.data || []).map(x => ({ ...x, type: "payment", customer_name: (x as any).customers?.name }))].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); }, enabled: !!ownerId }); }
export function useSuspendOwner() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId, suspend }: any) => { await supabase.from("profiles").update({ is_suspended: suspend, is_subscription_active: !suspend, subscription_status: suspend ? "expired" : "active" } as any).eq("user_id", userId).eq("role" as any, "owner" as any); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useActivateSubscription() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId, days }: any) => { await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: "active" }); }, onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-owners"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); } });}
export function usePauseSubscription() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ subscription_status: "expired", is_subscription_active: false } as any).eq("user_id", userId).eq("role" as any, "owner" as any); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useResumeSubscription() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ subscription_status: "active", is_subscription_active: true, is_suspended: false } as any).eq("user_id", userId).eq("role" as any, "owner" as any); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useResetSubscription() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId }: any) => { const now = new Date().toISOString(); await supabase.from("profiles").update({ subscription_status: "expired", is_subscription_active: false, subscription_ends_at: now, trial_ends_at: now } as any).eq("user_id", userId).eq("role" as any, "owner" as any); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useUpdateTrialDays() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId, days }: any) => { await supabase.rpc("extend_owner_subscription" as any, { p_owner_id: userId, p_days: days, p_months: 0, p_years: 0, p_status: days <= 0 ? "expired" : "trial" }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useCancelTrial() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ userId }: any) => { await supabase.from("profiles").update({ trial_ends_at: new Date().toISOString(), subscription_status: "expired", is_subscription_active: false } as any).eq("user_id", userId).eq("role" as any, "owner" as any); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-owners"] }) });}
export function useAdminPlans() { return useQuery({ queryKey: ["admin-plans"], queryFn: async () => { const { data: d, error: e } = await supabase.from("plans").select("*").order("sort_order"); if (e) throw e; return d || []; } }); }
export function useCreatePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async (p: any) => { await supabase.from("plans").insert(p); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }
export function useUpdatePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ id, ...u }: any) => { await supabase.from("plans").update(u).eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }
export function useDeletePlan() { const qc = useQueryClient(); return useMutation({ mutationFn: async (id: string) => { await supabase.from("plans").delete().eq("id", id); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }) }); }
export function useAppSettings() { return useQuery({ queryKey: ["app-settings"], queryFn: async () => { const { data: d, error: e } = await supabase.from("app_settings").select("*"); if (e) throw e; const s: Record<string, string> = {}; (d || []).forEach((x: any) => { s[x.key] = x.value; }); return s; } }); }
export function useUpdateSetting() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ key, value }: any) => { await supabase.from("app_settings").upsert({ key, value, updated_at: new Date().toISOString() }); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["app-settings"] }) }); }
export function useAdminRequests() { return useQuery({ queryKey: ["admin-requests"], queryFn: async () => { const { data: d, error: e } = await supabase.from("admin_requests" as any).select("*, profiles:owner_id(name, business_name, phone)").order("created_at", { ascending: false }); if (e) throw e; return d || []; } }); }
export function useApproveRequest() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ requestId, message }: any) => { await supabase.from("admin_requests" as any).update({ status: "approved", admin_message: message, updated_at: new Date().toISOString() }).eq("id", requestId); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }) }); }
export function useRejectRequest() { const qc = useQueryClient(); return useMutation({ mutationFn: async ({ requestId, message }: any) => { await supabase.from("admin_requests" as any).update({ status: "rejected", admin_message: message, updated_at: new Date().toISOString() }).eq("id", requestId); }, onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-requests"] }) }); }
export const useDeletionRequests = useAdminRequests; export const useApproveDeletion = useApproveRequest; export const useRejectDeletion = useRejectRequest;
export function useUpdateAdminAuth() { return useMutation({ mutationFn: async ({ email, password }: any) => { await supabase.auth.updateUser({ email, password }); } }); }
export function useExportOwnerData() {
  return useMutation({
    mutationFn: async ({ ownerId, businessName, prefetchedProfile }: any) => {
      const p = prefetchedProfile || { business_name: businessName, name: businessName };
      
      const [c, d, py] = await Promise.all([
        supabase.from("customers").select("*").eq("owner_id", ownerId),
        supabase.from("debts").select("*").eq("owner_id", ownerId),
        supabase.from("payments").select("*").eq("owner_id", ownerId)
      ]);

      const customersData = c.data || [];
      const debtsData = d.data || [];
      const paymentsData = py.data || [];

      // Calculate totals per customer
      const financials: Record<string, { debts: number, payments: number }> = {};
      customersData.forEach(cust => {
        financials[cust.id] = { debts: 0, payments: 0 };
      });

      debtsData.forEach(debt => {
        if (financials[debt.customer_id]) {
          financials[debt.customer_id].debts += (debt.amount || 0);
        }
      });

      paymentsData.forEach(payment => {
        if (financials[payment.customer_id]) {
          financials[payment.customer_id].payments += (payment.amount || 0);
        }
      });

      // Enrich customers with counts
      const enrichedCustomers = customersData.map(cust => ({
        ...cust,
        total_debts: financials[cust.id]?.debts || 0,
        total_payments: financials[cust.id]?.payments || 0,
        balance: (financials[cust.id]?.debts || 0) - (financials[cust.id]?.payments || 0)
      }));

      const m: Record<string, string> = {};
      enrichedCustomers.forEach(x => { m[x.id] = x.name; });

      const tx = [
        ...debtsData.map(x => ({ ...x, type: "debt", customer_name: m[x.customer_id] || "Unknown" })),
        ...paymentsData.map(x => ({ ...x, type: "payment", customer_name: m[x.customer_id] || "Unknown" }))
      ].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { profile: p, customers: enrichedCustomers, transactions: tx };
    }
  });
}
