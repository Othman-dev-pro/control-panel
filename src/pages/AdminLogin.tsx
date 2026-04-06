import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, Lock, ArrowRight, ArrowLeft, Globe, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { t, lang, setLang, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify super_admin role
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

      navigate("/admin/dashboard");
    } catch {
      toast({
        variant: "destructive",
        title: t("login.error"),
        description: t("login.invalidCredentials"),
      });
    } finally {
      setLoading(false);
    }
  };

  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm">
        <div className="mb-2 flex justify-end">
          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>

        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Shield className="h-7 w-7 text-secondary-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">{t("login.adminPortal")}</h1>
          <p className="text-sm text-muted-foreground">{t("login.adminSubtitle")}</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email" className="text-foreground">{t("login.email")}</Label>
            <div className="relative">
              <Mail className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                id="admin-email"
                type="email"
                dir="ltr"
                placeholder={t("login.emailPlaceholder")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={isRTL ? "pr-10 text-right" : "pl-10"}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password" className="text-foreground">{t("login.password")}</Label>
            <div className="relative">
              <Lock className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
              <Input
                id="admin-password"
                type="password"
                dir="ltr"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={isRTL ? "pr-10 text-right" : "pl-10"}
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Arrow className="h-4 w-4" />}
            {t("login.signinAdmin")}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("login.notAdmin")}{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            {t("login.regularLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
