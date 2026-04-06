import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useActiveAds() {
  return useQuery({
    queryKey: ["active-ads"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60000,
  });
}

export function useAllAds() {
  return useQuery({
    queryKey: ["all-ads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ads")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });
}

export function useCreateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ad: { image_url: string; link?: string; sort_order?: number }) => {
      const { error } = await supabase.from("ads").insert(ad);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-ads"] });
      qc.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
}

export function useUpdateAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; link?: string; sort_order?: number; starts_at?: string | null; ends_at?: string | null }) => {
      const { error } = await supabase.from("ads").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-ads"] });
      qc.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
}

export function useDeleteAd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-ads"] });
      qc.invalidateQueries({ queryKey: ["active-ads"] });
    },
  });
}
