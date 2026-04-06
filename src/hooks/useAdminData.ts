import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveStatus } from "@/lib/utils";

export function useAdminOwners(page = 1, pageSize = 12) {
  return useQuery({
    queryKey: ["admin-owners", page, pageSize],
    queryFn: async () => {
      // 1. Try to fetch with RPC first (calculated securely in DB)
      const { data, error } = await supabase.rpc("get_admin_owners_stats", {
        p_limit: pageSize,
        p_offset: (page - 1) * pageSize
      });
      
      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          subscription_status: getEffectiveStatus(p),
          stats: {
            customersCount: Number(p.customers_count || 0),
            totalDebts: Number(p.total_debts || 0),
            totalPayments: Number(p.total_payments || 0),
            remainingBalance: Number(p.remaining_balance || 0)
          }
        }));
      }

      // 2. Fallback to direct profiles if RPC fails (will show 0 stats but won't crash)
      console.warn("Stats RPC failed, falling back to basic display. Make sure to run the SQL script.");
      const { data: directData, error: directError } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "owner")
        .order("created_at", { ascending: false });
      
      if (directError) throw directError;

      return (directData || []).map((p: any) => ({
        ...p,
        subscription_status: getEffectiveStatus(p),
        stats: {
          customersCount: 0,
          totalDebts: 0,
          totalPayments: 0,
          remainingBalance: 0
        }
      }));
    },
    staleTime: 1000 * 60 * 5, 
  });
}

export function useOwnerCustomers(ownerId: string) {
  return useQuery({
    queryKey: ["owner-customers", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      
      // Fetch customers
      const { data: customers, error: customerError } = await supabase
        .from("customers")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name", { ascending: true });
      if (customerError) throw customerError;

      // Fetch all transaction dates for this owner's customers to find the first movement
      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("customer_id, created_at").eq("owner_id", ownerId),
        supabase.from("payments").select("customer_id, created_at").eq("owner_id", ownerId),
      ]);

      const firstTxMap: Record<string, string> = {};
      
      const processDates = (items: any[]) => {
        items.forEach(item => {
          const cid = item.customer_id;
          const date = item.created_at;
          if (!firstTxMap[cid] || new Date(date) < new Date(firstTxMap[cid])) {
            firstTxMap[cid] = date;
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

      if (debtsRes.error) throw debtsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const debts = (debtsRes.data || []).map(d => ({ ...d, type: "debt" }));
      const payments = (paymentsRes.data || []).map(p => ({ ...p, type: "payment" }));

      return [...debts, ...payments].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!customerId,
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      // 1. Try RPC first
      const { data, error } = await supabase.rpc("get_admin_dashboard_stats");
      
      if (!error && data) return data;

      // 2. Manual Fallback if RPC fails
      console.warn("Stats RPC failed, calculating manually...");
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("subscription_status, role")
        .eq("role", "owner");

      if (pError) throw pError;

      const stats = {
        totalOwners: (profiles || []).length,
        activeSubscriptions: (profiles || []).filter(p => p.subscription_status === 'active').length,
        totalCustomers: 0, // Fallback doesn't have deep customer count without more queries
        totalRevenue: 0,
      };

      return stats;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache for global stats
  });
}

export function useActivateSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      // استخدام وظيفة التمديد الجديدة التي تتحقق من الدور وتتجنب تعارض القيود
      const { error } = await supabase.rpc("extend_owner_subscription", {
        p_owner_id: userId,
        p_days: days,
        p_months: 0,
        p_years: 0,
        p_status: "active",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useSuspendOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, suspend }: { userId: string; suspend: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_suspended: suspend,
          is_subscription_active: !suspend,
          // عند الإيقاف نجعل الحالة 'expired'، وعند التفعيل نجعلها 'active'
          subscription_status: suspend ? "expired" : "active",
        })
        .eq("user_id", userId)
        .eq("role", "owner"); // تأكد أننا نحدث مالكاً فقط
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
    },
  });
}

export function usePauseSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          is_subscription_active: false,
        })
        .eq("user_id", userId)
        .eq("role", "owner"); // تأكد أننا نحدث مالكاً فقط
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          is_subscription_active: true,
          is_suspended: false,
        })
        .eq("user_id", userId)
        .eq("role", "owner");
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useResetSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          is_subscription_active: false,
          subscription_ends_at: now,
          trial_ends_at: now,
        })
        .eq("user_id", userId)
        .eq("role", "owner");
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
      await qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useUpdateTrialDays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, days }: { userId: string; days: number }) => {
      // استخدام وظيفة التمديد الجديدة بدل من التحديث المباشر لتجنب تعارض القيود
      const { error } = await supabase.rpc("extend_owner_subscription", {
        p_owner_id: userId,
        p_days: days,
        p_months: 0,
        p_years: 0,
        p_status: days <= 0 ? "expired" : "trial",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
    },
  });
}

export function useCancelTrial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({
          trial_ends_at: new Date().toISOString(),
          subscription_status: "expired",
          is_subscription_active: false,
        })
        .eq("user_id", userId)
        .eq("role", "owner"); // تأكد أننا نحدث مالكاً فقط
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-owners"] });
    },
  });
}

export function useAdminPlans() {
  return useQuery({
    queryKey: ["admin-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: {
      name_ar: string; name_en: string; price: number; duration_days: number;
      features_ar: string[]; features_en: string[]; is_popular: boolean;
    }) => {
      const { error } = await supabase.from("plans").insert(plan);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }),
  });
}

export function useUpdatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string; name_ar?: string; name_en?: string; price?: number;
      duration_days?: number; features_ar?: string[]; features_en?: string[];
      is_popular?: boolean; is_active?: boolean;
    }) => {
      const { error } = await supabase.from("plans").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }),
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("plans").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-plans"] }),
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

export function useUpdateSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["app-settings"] }),
  });
}

export function useDeleteOwner() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      // 1. Delete linked employees (profiles where owner_id = userId)
      const { error: employeesError } = await supabase
        .from("profiles")
        .delete()
        .eq("owner_id", userId);
      if (employeesError) throw employeesError;

      // 2. Delete the owner profile itself
      const { error: ownerError } = await supabase
        .from("profiles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "owner");
      if (ownerError) throw ownerError;
      
      // Note: Supabase RLS and foreign keys should handle the rest 
      // (like customers staying but losing their owner link if configured)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-owners"] });
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export function useOwnerTransactions(ownerId: string) {
  return useQuery({
    queryKey: ["owner-transactions", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const [debtsRes, paymentsRes] = await Promise.all([
        supabase.from("debts").select("*, customers(name)").eq("owner_id", ownerId),
        supabase.from("payments").select("*, customers(name)").eq("owner_id", ownerId),
      ]);

      if (debtsRes.error) throw debtsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      const debts = (debtsRes.data || []).map(d => ({ 
        ...d, 
        type: "debt",
        customer_name: d.customers?.name 
      }));
      const payments = (paymentsRes.data || []).map(p => ({ 
        ...p, 
        type: "payment",
        customer_name: p.customers?.name 
      }));

      return [...debts, ...payments].sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
    enabled: !!ownerId,
  });
}

export function useUpdateAdminAuth() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }: { email?: string; password?: string }) => {
      const { data, error } = await supabase.auth.updateUser({ email, password });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

// Unified Administrative Requests (Deletion, Backup, etc.)
export function useAdminRequests() {
  return useQuery({
    queryKey: ["admin-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_requests")
        .select("*, profiles:owner_id(name, business_name, phone)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  const deleteOwner = useDeleteOwner();

  return useMutation({
    mutationFn: async ({ requestId, ownerId, type, message, days, isManual }: { 
      requestId: string; ownerId: string; type: 'deletion' | 'backup'; message: string; days?: number; isManual?: boolean 
    }) => {
      let finalMsg = message;
      let status = "approved";
      let scheduledDeletionAt = null;

      if (type === 'deletion') {
        if (isManual) {
          finalMsg = message || "تمت الموافقة على طلبك. سيتم حذف حسابك يدوياً خلال 5 دقائق.";
          status = "approved";
        } else {
          const d = days || 1;
          const deletionDate = new Date();
          deletionDate.setDate(deletionDate.getDate() + d);
          scheduledDeletionAt = deletionDate.toISOString();
          finalMsg = message || `تمت الموافقة على طلبك. سيتم حذف الحساب نهائياً بعد ${d} يوم/أيام (بتاريخ ${deletionDate.toLocaleDateString('ar-YE')}).`;
          status = "scheduled";
        }
      } else if (type === 'backup') {
        finalMsg = message || "تمت الموافقة على طلب النسخة الاحتياطية. سيتم التواصل معك قريباً لإرسال الملف.";
        status = "approved";
      }
      
      // 1. Send notification to owner
      await supabase.from("notifications").insert({
        user_id: ownerId,
        title: type === 'deletion' ? "تحديث طلب حذف الحساب" : "تحديث طلب النسخ الاحتياطي",
        message: finalMsg,
        type: "info"
      });

      // 2. Update request status
      const { error } = await supabase.from("admin_requests").update({ 
        status: status, 
        admin_message: finalMsg,
        scheduled_deletion_at: scheduledDeletionAt,
        updated_at: new Date().toISOString() 
      }).eq("id", requestId);
      
      if (error) throw error;

      // 3. If DELETION + IMMEDIATE: Execute purge now (or admin does it manually as per request)
      // Note: Staying with 'admin does it manually from Owners page' as requested for Deletion.
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
    },
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, ownerId, type, message }: { requestId: string; ownerId: string; type: string; message: string }) => {
      const { error } = await supabase.from("admin_requests").update({ 
        status: "rejected", 
        admin_message: message,
        updated_at: new Date().toISOString() 
      }).eq("id", requestId);
      if (error) throw error;

      // Send rejection notification
      await supabase.from("notifications").insert({
        user_id: ownerId,
        title: type === 'deletion' ? "رفض طلب حذف الحساب" : "رفض طلب النسخة الاحتياطية",
        message: message || "عذراً، تم رفض طلبك. يرجى مراجعة الإدارة.",
        type: "info"
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-requests"] });
    },
  });
}
