import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getEffectiveStatus } from "@/lib/utils";

export type UserRole = "super_admin" | "owner" | "employee" | "customer";

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  roles: UserRole[];
  owner_id: string | null;
  subscription_status: "trial" | "active" | "expired";
  trial_ends_at: string;
  subscription_ends_at: string | null;
  is_subscription_active: boolean;
  business_name?: string;
  username?: string;
}

interface AuthContextType {
  user: User | null;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
  supabaseUser: SupabaseUser | null;
  setActiveRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACTIVE_ROLE_KEY = "debtflow_active_role";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auth version counter - increments on every auth state change to invalidate stale loads
  const authVersionRef = React.useRef(0);

  const loadUserProfile = useCallback(async (authUser: SupabaseUser, version: number) => {
    try {
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authUser.id);

      // Check if this load is still valid (no signOut happened since)
      if (authVersionRef.current !== version) return;

      const roles = (rolesData?.map(r => r.role) as UserRole[]) || [];
      
      const storedRole = localStorage.getItem(ACTIVE_ROLE_KEY) as UserRole | null;
      const activeRole = storedRole && roles.includes(storedRole) 
        ? storedRole 
        : roles[0] || "customer";

      let profile: any = null;
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", authUser.id)
          .maybeSingle();
        if (!error) profile = data;
      } catch {
        // Profile access denied by RLS
      }

      // Check again before setting state
      if (authVersionRef.current !== version) return;

      setUser({
        id: authUser.id,
        name: profile?.name || authUser.user_metadata?.name || "",
        phone: profile?.phone || authUser.phone || "",
        email: profile?.email || authUser.email || "",
        role: activeRole,
        roles,
        owner_id: profile?.owner_id || null,
        subscription_status: (getEffectiveStatus(profile) as "trial" | "active" | "expired") || "trial",
        trial_ends_at: profile?.trial_ends_at || "",
        subscription_ends_at: profile?.subscription_ends_at || null,
        is_subscription_active: profile?.is_subscription_active ?? true,
        business_name: profile?.business_name || undefined,
        username: profile?.username || undefined,
      });
      setSupabaseUser(authUser);
    } catch (err) {
      console.error("Failed to load user profile:", err);
      if (authVersionRef.current === version) {
        setUser(null);
        setSupabaseUser(null);
      }
    }
  }, []);

  const setActiveRole = useCallback((role: UserRole) => {
    localStorage.setItem(ACTIVE_ROLE_KEY, role);
    setUser(prev => prev ? { ...prev, role } : null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        // Increment version on EVERY auth state change
        const version = ++authVersionRef.current;
        if (session?.user) {
          setTimeout(() => {
            if (isMounted && authVersionRef.current === version) {
              loadUserProfile(session.user, version);
            }
          }, 0);
        } else {
          setUser(null);
          setSupabaseUser(null);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          const version = ++authVersionRef.current;
          await loadUserProfile(session.user, version);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const logout = useCallback(async () => {
    localStorage.removeItem(ACTIVE_ROLE_KEY);
    authVersionRef.current++;
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, logout, isAuthenticated: !!user, loading, supabaseUser, setActiveRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
