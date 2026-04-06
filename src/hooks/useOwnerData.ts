import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Types
export interface Customer {
  id: string;
  owner_id: string;
  user_id: string | null;
  name: string;
  phone: string;
  address: string | null;
  debt_limit: number | null;
  is_active: boolean;
  created_at: string;
}

export interface Debt {
  id: string;
  customer_id: string;
  owner_id: string;
  amount: number;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  operation_number: number;
  customer?: Customer;
}

export interface Payment {
  id: string;
  debt_id: string;
  customer_id: string;
  owner_id: string;
  amount: number;
  description: string | null;
  created_by: string;
  created_at: string;
  operation_number: number;
  customer?: Customer;
}

// Get effective owner_id (for employees, use their owner_id)
function useEffectiveOwnerId() {
  const { user } = useAuth();
  if (!user) return null;
  return user.role === "employee" ? user.owner_id : user.id;
}

// ===================== CUSTOMERS =====================

export function useCustomers() {
  const ownerId = useEffectiveOwnerId();
  return useQuery({
    queryKey: ["customers", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Customer[];
    },
    enabled: !!ownerId,
  });
}

export function useCreateCustomer() {
  const qc = useQueryClient();
  const ownerId = useEffectiveOwnerId();
  return useMutation({
    mutationFn: async (customer: { name: string; phone: string; address?: string; debt_limit?: number | null }) => {
      // Auto-link: use security definer function to find customer user by phone
      const cleanPhone = customer.phone.replace(/\D/g, "");
      const { data: userId } = await supabase.rpc("find_customer_user_by_phone", { _phone: cleanPhone });
      const linkedUserId: string | null = userId || null;

      const { data, error } = await supabase
        .from("customers")
        .insert({ name: customer.name, phone: customer.phone, address: customer.address, debt_limit: customer.debt_limit ?? null, owner_id: ownerId!, user_id: linkedUserId })
        .select()
        .single();
      if (error) throw error;
      return { ...data, linked: !!linkedUserId };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; phone?: string; address?: string; debt_limit?: number | null }) => {
      // Check 1-month lock on debt_limit changes
      if (updates.debt_limit !== undefined) {
        // Get current customer data
        const { data: currentCustomer } = await supabase
          .from("customers")
          .select("debt_limit")
          .eq("id", id)
          .single();

        // Only check lock if debt_limit is actually changing
        if (currentCustomer && currentCustomer.debt_limit !== updates.debt_limit) {
          // Find earliest transaction (debt or payment)
          const [{ data: firstDebt }, { data: firstPayment }] = await Promise.all([
            supabase.from("debts").select("created_at").eq("customer_id", id).order("created_at", { ascending: true }).limit(1),
            supabase.from("payments").select("created_at").eq("customer_id", id).order("created_at", { ascending: true }).limit(1),
          ]);

          const firstDebtDate = firstDebt?.[0]?.created_at;
          const firstPaymentDate = firstPayment?.[0]?.created_at;
          
          let firstTransactionDate: string | null = null;
          if (firstDebtDate && firstPaymentDate) {
            firstTransactionDate = firstDebtDate < firstPaymentDate ? firstDebtDate : firstPaymentDate;
          } else {
            firstTransactionDate = firstDebtDate || firstPaymentDate || null;
          }

          if (firstTransactionDate) {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const txDate = new Date(firstTransactionDate);
            
            if (txDate > oneMonthAgo) {
              throw new Error("DEBT_LIMIT_LOCKED");
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("customers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Check if customer has outstanding debts
      const { data: debts } = await supabase
        .from("debts")
        .select("id, amount")
        .eq("customer_id", id);
      const { data: payments } = await supabase
        .from("payments")
        .select("amount")
        .eq("customer_id", id);

      const totalDebts = (debts || []).reduce((s, d) => s + Number(d.amount), 0);
      const totalPayments = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
      const balance = totalDebts - totalPayments;

      if (balance > 0) {
        throw new Error("CUSTOMER_HAS_DEBT");
      }

      // Delete related records first (payments → debts → orders → customer)
      await supabase.from("payments").delete().eq("customer_id", id);
      await supabase.from("debts").delete().eq("customer_id", id);
      await supabase.from("orders").delete().eq("customer_id", id);

      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useToggleCustomerActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from("customers")
        .update({ is_active })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

// ===================== DEBTS =====================

export function useDebts() {
  const ownerId = useEffectiveOwnerId();
  return useQuery({
    queryKey: ["debts", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("debts")
        .select("*, customer:customers(id, name, phone)")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Debt & { customer: Pick<Customer, "id" | "name" | "phone"> })[];
    },
    enabled: !!ownerId,
  });
}

export function useCreateDebt() {
  const qc = useQueryClient();
  const ownerId = useEffectiveOwnerId();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (debt: { customer_id: string; amount: number; description: string; image_url?: string }) => {
      // Check debt limit
      const { data: customer } = await supabase
        .from("customers")
        .select("debt_limit")
        .eq("id", debt.customer_id)
        .single();

      if (customer?.debt_limit != null) {
        // Get current total outstanding
        const { data: existingDebts } = await supabase
          .from("debts")
          .select("amount")
          .eq("customer_id", debt.customer_id);
        const { data: existingPayments } = await supabase
          .from("payments")
          .select("amount")
          .eq("customer_id", debt.customer_id);
        const totalDebts = (existingDebts || []).reduce((s, d) => s + Number(d.amount), 0);
        const totalPayments = (existingPayments || []).reduce((s, p) => s + Number(p.amount), 0);
        const currentBalance = totalDebts - totalPayments;

        if (currentBalance + debt.amount > customer.debt_limit) {
          throw new Error("DEBT_LIMIT_EXCEEDED");
        }
      }

      const { data, error } = await supabase
        .from("debts")
        .insert({ ...debt, owner_id: ownerId!, created_by: user!.id })
        .select("*, customer:customers(id, name, phone)")
        .single();
      if (error) throw error;

      // Notifications are handled by database triggers
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

export function useDeleteDebt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

// ===================== PAYMENTS =====================

export function usePayments() {
  const ownerId = useEffectiveOwnerId();
  return useQuery({
    queryKey: ["payments", ownerId],
    queryFn: async () => {
      if (!ownerId) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("*, customer:customers(id, name, phone)")
        .eq("owner_id", ownerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as (Payment & { customer: Pick<Customer, "id" | "name" | "phone"> })[];
    },
    enabled: !!ownerId,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  const ownerId = useEffectiveOwnerId();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payment: { customer_id: string; amount: number; description?: string }) => {
      // Get all debts for this customer, ordered oldest first
      const { data: debts } = await supabase
        .from("debts")
        .select("id, amount")
        .eq("customer_id", payment.customer_id)
        .eq("owner_id", ownerId!)
        .order("created_at", { ascending: true });

      // Get existing payments to calculate remaining per debt
      const { data: existingPayments } = await supabase
        .from("payments")
        .select("debt_id, amount")
        .eq("customer_id", payment.customer_id)
        .eq("owner_id", ownerId!);

      const paidMap: Record<string, number> = {};
      (existingPayments || []).forEach((p) => {
        paidMap[p.debt_id] = (paidMap[p.debt_id] || 0) + Number(p.amount);
      });

      // Auto-distribute payment across debts (oldest first)
      let remaining = payment.amount;
      const insertedPayments: any[] = [];

      for (const debt of debts || []) {
        if (remaining <= 0) break;
        const paid = paidMap[debt.id] || 0;
        const debtRemaining = Number(debt.amount) - paid;
        if (debtRemaining <= 0) continue;
        const payAmount = Math.min(remaining, debtRemaining);

        const { data, error } = await supabase
          .from("payments")
          .insert({
            debt_id: debt.id,
            customer_id: payment.customer_id,
            owner_id: ownerId!,
            amount: payAmount,
            description: payment.description || null,
            created_by: user!.id,
          })
          .select()
          .single();
        if (error) throw error;
        insertedPayments.push(data);
        remaining -= payAmount;
      }

      if (insertedPayments.length === 0) {
        throw new Error("NO_OUTSTANDING_DEBTS");
      }

      const appliedAmount = insertedPayments.reduce((sum, item) => sum + Number(item.amount), 0);
      const returnedAmount = Math.max(0, Number(payment.amount) - appliedAmount);

      // Notifications are handled by database triggers
      return {
        insertedPayments,
        appliedAmount,
        returnedAmount,
      };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payments"] });
      qc.invalidateQueries({ queryKey: ["debts"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats"] });
    },
  });
}

// ===================== DASHBOARD STATS =====================

export function useDashboardStats() {
  const ownerId = useEffectiveOwnerId();
  return useQuery({
    queryKey: ["dashboard-stats", ownerId],
    queryFn: async () => {
      if (!ownerId) return { totalCustomers: 0, totalDebts: 0, totalPayments: 0, balance: 0 };

      const [customersRes, debtsRes, paymentsRes] = await Promise.all([
        supabase.from("customers").select("id", { count: "exact", head: true }).eq("owner_id", ownerId),
        supabase.from("debts").select("amount").eq("owner_id", ownerId),
        supabase.from("payments").select("amount").eq("owner_id", ownerId),
      ]);

      const totalDebts = (debtsRes.data || []).reduce((sum, d) => sum + Number(d.amount), 0);
      const totalPayments = (paymentsRes.data || []).reduce((sum, p) => sum + Number(p.amount), 0);

      return {
        totalCustomers: customersRes.count || 0,
        totalDebts,
        totalPayments,
        balance: totalDebts - totalPayments,
      };
    },
    enabled: !!ownerId,
  });
}

// ===================== EMPLOYEES =====================

export function useEmployees() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["employees", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("owner_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user && user.role === "owner",
  });
}
