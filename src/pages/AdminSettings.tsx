import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting, useUpdateAdminAuth } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Settings2, 
  Save, 
  RefreshCcw, 
  ShieldCheck, 
  Bell, 
  Global, 
  Database,
  Cpu,
  Lock,
  MessageSquare,
  Mail,
  KeyRound,
  ShieldAlert,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminSettings() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const { data: settings = [], isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();
  const updateAuth = useUpdateAdminAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (settings && typeof settings === 'object') {
      const data: Record<string, string> = {};
      Object.entries(settings).forEach(([key, value]) => {
        data[key] = value as string;
      });
      setFormData(data);
    }
  }, [settings]);

  const handleSave = async (key: string) => {
    try {
      await updateSetting.mutateAsync({ key, value: formData[key] || "" });
      toast({ title: t("common.success") });
    } catch {
      toast({ variant: "destructive", title: t("common.error") });
    }
  };

  const handleAllSave = async () => {
    try {
      await Promise.all(
        Object.entries(formData).map(([key, value]) => 
          updateSetting.mutateAsync({ key, value })
        )
      );
      toast({ title: t("common.success"), description: lang === "ar" ? "تم حفظ كافة الإعدادات بنجاح" : "All settings saved successfully" });
    } catch {
      toast({ variant: "destructive", title: t("common.error") });
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast({ variant: "destructive", title: lang === "ar" ? "بريد غير صالح" : "Invalid Email" });
      return;
    }
    try {
      await updateAuth.mutateAsync({ email: newEmail });
      toast({ 
        title: lang === "ar" ? "تم إرسال التأكيد" : "Confirmation Sent", 
        description: lang === "ar" ? "يرجى مراجعة البريد الإلكتروني الجديد لتأكيد التغيير" : "Please check your new email to confirm the change" 
      });
      setNewEmail("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toast({ variant: "destructive", title: lang === "ar" ? "كلمة المرور قصيرة" : "Password too short" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: "destructive", title: lang === "ar" ? "كلمات المرور غير متطابقة" : "Passwords do not match" });
      return;
    }
    try {
      await updateAuth.mutateAsync({ password: newPassword });
      toast({ title: lang === "ar" ? "تم تحديث كلمة المرور" : "Password Updated" });
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-10 animate-in fade-in duration-700 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-inner">
              <Settings2 className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{t("admin.settings")}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">{lang === "ar" ? "تحكم في معايير النظام وأمان الحساب" : "System Core & Account Security Parameters"}</p>
            </div>
          </div>
          <Button onClick={handleAllSave} size="lg" className="h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
            <Save className="h-4 w-4" />
            {lang === "ar" ? "حفظ كافة التغييرات" : "Commit All Changes"}
          </Button>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} />
        ) : (
          <div className="grid gap-10">
            {/* Account Security Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <ShieldAlert className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "أمان الحساب الإداري" : "Admin Account Security"}</h2>
              </div>
              
              <div className="grid gap-12 lg:grid-cols-2">
                {/* Email Update */}
                <div className="space-y-6 p-8 rounded-[32px] bg-white/40 border border-border/30 shadow-inner">
                    <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary opacity-40" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{lang === "ar" ? "تعديل البريد الإلكتروني" : "Update Login Email"}</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="space-y-1.5 px-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground opacity-50 tracking-widest">{lang === "ar" ? "البريد الحالي:" : "Current Email:"}</p>
                            <p className="text-sm font-bold text-foreground/70 italic">{user?.email}</p>
                        </div>
                        <Input 
                            placeholder={lang === "ar" ? "البريد الإلكتروني الجديد..." : "New email address..."}
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="h-14 rounded-2xl bg-white border-border/40 focus:ring-primary/20 font-bold"
                        />
                        <Button 
                            onClick={handleUpdateEmail} 
                            disabled={updateAuth.isPending}
                            className="w-full h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02]"
                        >
                            {updateAuth.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4 me-2" />}
                            {lang === "ar" ? "إرسال طلب التغيير" : "Update Auth Email"}
                        </Button>
                    </div>
                </div>

                {/* Password Update */}
                <div className="space-y-6 p-8 rounded-[32px] bg-white/40 border border-border/30 shadow-inner">
                    <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-primary opacity-40" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-foreground">{lang === "ar" ? "تغيير كلمة المرور" : "Update Password"}</h3>
                    </div>
                    <div className="space-y-4">
                        <Input 
                            type="password"
                            placeholder={lang === "ar" ? "كلمة المرور الجديدة..." : "New password..."}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="h-14 rounded-2xl bg-white border-border/40 focus:ring-primary/20 font-bold"
                        />
                        <Input 
                            type="password"
                            placeholder={lang === "ar" ? "تأكيد كلمة المرور..." : "Confirm new password..."}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-14 rounded-2xl bg-white border-border/40 focus:ring-primary/20 font-bold"
                        />
                        <Button 
                            onClick={handleUpdatePassword}
                            disabled={updateAuth.isPending}
                            className="w-full h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02]"
                        >
                            {updateAuth.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4 me-2" />}
                            {lang === "ar" ? "تحديث كلمة المرور" : "Apply New Password"}
                        </Button>
                    </div>
                </div>
              </div>
            </div>

            {/* System Configuration Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <Cpu className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "إعدادات المحرك" : "Engine Configuration"}</h2>
              </div>
              
              <div className="grid gap-12 sm:grid-cols-2">
                {Object.keys(formData).length > 0 ? Object.keys(formData).sort().map((key) => (
                  <div key={key} className="space-y-4 group">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                            <Database className="h-3 w-3" />
                            {key.replace(/_/g, ' ')}
                        </Label>
                        <Button variant="ghost" size="icon" onClick={() => handleSave(key)} className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-primary hover:bg-primary/10">
                            <RefreshCcw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <Input 
                      value={formData[key]} 
                      onChange={(e) => setFormData(p => ({ ...p, [key]: e.target.value }))}
                      className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-bold transition-all"
                    />
                  </div>
                )) : (
                    <div className="col-span-2 py-32 text-center opacity-20">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                        <p className="font-black uppercase tracking-widest italic">{lang === "ar" ? "لا توجد متغيرات مسجلة" : "No Registered Parameters"}</p>
                    </div>
                )}
              </div>
            </div>

            {/* Support Information Section */}
            <div className="grid gap-6 sm:grid-cols-2">
                <div className="bg-emerald-500/5 backdrop-blur-sm p-8 rounded-[32px] border border-emerald-500/10 flex items-center gap-6 group hover:border-emerald-500/30 transition-all shadow-sm">
                    <div className="h-14 w-14 rounded-[20px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <ShieldCheck className="h-7 w-7" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.1em] text-emerald-700">{lang === "ar" ? "حماية النظام" : "System Integrity"}</h4>
                        <p className="text-[10px] font-bold text-emerald-600/60 mt-0.5">{lang === "ar" ? "كافة الاتصالات مشفرة ببروتوكول SSL/TLS" : "All communications are SSL/TLS Encrypted"}</p>
                    </div>
                </div>
                <div className="bg-blue-500/5 backdrop-blur-sm p-8 rounded-[32px] border border-blue-500/10 flex items-center gap-6 group hover:border-blue-500/30 transition-all shadow-sm">
                    <div className="h-14 w-14 rounded-[20px] bg-blue-500/10 text-blue-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Lock className="h-7 w-7" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-[0.1em] text-blue-700">{lang === "ar" ? "الأمان الإداري" : "Admin Security"}</h4>
                        <p className="text-[10px] font-bold text-blue-600/60 mt-0.5">{lang === "ar" ? "الوصول مقيد فقط للمشرفين المعتمدين" : "Access restricted to vetted personnel only"}</p>
                    </div>
                </div>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
