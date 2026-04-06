import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, ArrowRight, ArrowLeft, Globe, Loader2, Sparkles, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { t, lang, setLang, isRTL } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in as super_admin, redirect immediately
  useEffect(() => {
    if (user?.role === "super_admin") {
      navigate("/admin/dashboard");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);

    try {
      // 1. Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 2. Verify super_admin role directly from DB immediately
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id)
        .eq("role", "super_admin")
        .maybeSingle();

      if (roleError || !roleData) {
        await supabase.auth.signOut();
        toast({
          variant: "destructive",
          title: t("login.error"),
          description: t("login.invalidCredentials"),
        });
        setLoading(false);
        return;
      }

      // 3. Show success state before navigating to ensure AuthContext catches up
      setSuccess(true);
      
      // Small delay helps the AuthContext's onAuthStateChange propagate to all listeners
      // eliminating the "double login" issue where the next page thinks user is null
      setTimeout(() => {
        navigate("/admin/dashboard");
      }, 800);

    } catch (error: any) {
      console.error("Login Error:", error);
      toast({
        variant: "destructive",
        title: t("login.error"),
        description: error.message || t("login.invalidCredentials"),
      });
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] overflow-hidden relative">
      {/* Premium Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }} />
      
      <div className="w-full max-w-[420px] px-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="group flex items-center gap-2 rounded-2xl border border-border/50 bg-white/50 backdrop-blur-md px-4 py-2 text-xs font-bold text-muted-foreground hover:text-primary hover:border-primary/30 transition-all shadow-sm"
          >
            <Globe className="h-3.5 w-3.5 group-hover:rotate-12 transition-transform" />
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>

        <div className="rounded-[32px] border border-white bg-white/70 backdrop-blur-xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-black/5">
          <div className="mb-10 flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-150 opacity-50" />
              <div className="relative flex h-16 w-16 items-center justify-center rounded-[22px] bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20 transform hover:scale-105 transition-transform duration-500">
                <Shield className="h-8 w-8" />
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <h1 className="text-2xl font-black tracking-tight text-foreground">{t("login.adminPortal")}</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60 flex items-center justify-center gap-2">
                <Sparkles className="h-3 w-3 text-primary" />
                {t("login.adminSubtitle")}
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="admin-email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ps-1">{t("login.email")}</Label>
              <div className="relative group">
                <Mail className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary ${isRTL ? "right-4" : "left-4"}`} />
                <Input
                  id="admin-email"
                  type="email"
                  dir="ltr"
                  placeholder={t("login.emailPlaceholder")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 rounded-2xl border-border/50 bg-white/50 backdrop-blur-sm focus:ring-primary/20 shadow-sm transition-all ${isRTL ? "pr-11 text-right" : "pl-11"}`}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between ps-1">
                <Label htmlFor="admin-password" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{t("login.password")}</Label>
              </div>
              <div className="relative group">
                <Lock className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary ${isRTL ? "right-4" : "left-4"}`} />
                <Input
                  id="admin-password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 rounded-2xl border-border/50 bg-white/50 backdrop-blur-sm focus:ring-primary/20 shadow-sm transition-all ${isRTL ? "pr-11 text-right" : "pl-11"}`}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className={`w-full h-12 rounded-[20px] font-bold text-sm gap-2 transition-all shadow-md group ${
                success ? "bg-emerald-500 hover:bg-emerald-600" : "bg-primary hover:bg-primary/90 hover:shadow-primary/20"
              }`} 
              disabled={loading}
            >
              {success ? (
                <div className="flex items-center gap-2 animate-in zoom-in duration-300">
                  <CheckCircle2 className="h-5 w-5" />
                  {lang === "ar" ? "جاري الدخول..." : "Entering..."}
                </div>
              ) : loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <span className="flex-1 text-center">{t("login.signinAdmin")}</span>
                  <Arrow className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? "group-hover:-translate-x-1" : ""}`} />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-dashed border-border/50 text-center">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {t("login.notAdmin")}{" "}
              <Link to="/login" className="font-black text-primary hover:underline underline-offset-4">
                {t("login.regularLink")}
              </Link>
            </p>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-muted-foreground/40 font-bold uppercase tracking-[0.2em]">
          &copy; {new Date().getFullYear()} DEAN APP • ELITE ADMIN SYSTEM
        </p>
      </div>
    </div>
  );
}
