import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getEffectiveStatus } from "@/lib/utils";

export function useAdminOwners() {
  return useQuery({
    queryKey: ["admin-owners"],
    queryFn: async () => {
      // Step 1: get owner user_ids from user_roles
      const { data: ownerRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "owner");
      if (rolesError) throw rolesError;
      if (!ownerRoles?.length) return [];

      const ownerIds = ownerRoles.map(r => r.user_id);

      // Step 2: fetch their profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ownerIds);
      if (error) throw error;

      return (profiles || []).map((p: any) => ({
        ...p,
        subscription_status: getEffectiveStatus(p)
      }));
    },
  });
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [ownersRes, customersRes, debtsRes, paymentsRes] = await Promise.all([
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "owner"),
        supabase.from("customers").select("id", { count: "exact", head: true }),
        supabase.from("debts").select("amount"),
        supabase.from("payments").select("amount"),
      ]);

      const totalDebts = (debtsRes.data || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const totalPayments = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

      // حساب الاشتراكات النشطة للمالكين فقط
      const { data: activeProfiles } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_ends_at")
        .eq("role", "owner"); // فلترة المالكين فقط

      let activeCount = 0;
      const now = new Date();
      (activeProfiles || []).forEach(p => {
        if (p.subscription_status === "active" && (!p.subscription_ends_at || new Date(p.subscription_ends_at) >= now)) {
          activeCount++;
        }
      });

      return {
        totalOwners: ownersRes.count || 0,
        activeSubscriptions: activeCount || 0,
        totalCustomers: customersRes.count || 0,
        totalRevenue: totalPayments,
      };
    },
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
          ...(suspend ? { subscription_status: "expired" } : {}),
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
