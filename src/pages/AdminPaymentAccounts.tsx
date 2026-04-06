import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Save, Loader2, Banknote, Building2, Landmark, Wallet, ShieldCheck, Sparkles } from "lucide-react";
import { StatsSkeleton } from "@/components/SkeletonLoader";

export default function AdminPaymentAccounts() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings = [], isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [stcPays, setStcPays] = useState("");
  const [bankAccounts, setBankAccounts] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setStcPays(settings["admin_stc_pay"] || "");
      setBankAccounts(settings["admin_bank_accounts"] || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "admin_stc_pay", value: stcPays }),
        updateSetting.mutateAsync({ key: "admin_bank_accounts", value: bankAccounts }),
      ]);
      toast({ title: t("common.success") });
    } catch {
      toast({ variant: "destructive", title: t("common.error") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-inner">
              <Sparkles className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                {lang === "ar" ? "حسابات التحصيل" : "Payment Infrastructure"}
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                {lang === "ar" ? "إعداد حسابات استقبال اشتراكات المنشآت" : "Orchestrate subscription revenue terminals"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {lang === "ar" ? "تفعيل الحسابات" : "Authorize Terminals"}
          </Button>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-8">
            {/* Payment Nodes Configuration */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <Landmark className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "نقاط التحصيل" : "Revenue Gateways"}</h2>
              </div>
              
              <div className="grid gap-12">
                <div className="space-y-4 group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                        <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                        {lang === "ar" ? "STC Pay (مفصول بفاصلة)" : "STC Pay Nodes (Comma Separated)"}
                    </label>
                    <span className="text-[8px] font-black text-emerald-600 bg-emerald-500/5 px-2 py-0.5 rounded uppercase tracking-widest">Digital_Wallet_Link</span>
                  </div>
                  <Input 
                    value={stcPays} 
                    onChange={e => setStcPays(e.target.value)} 
                    placeholder="05xxxxxxx, 05yyyyyyy" 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>

                <div className="space-y-4 group">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-blue-500" />
                        {lang === "ar" ? "الحسابات البنكية (نص حر)" : "Banking Institutions (Raw Text Override)"}
                    </label>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-500/5 px-2 py-0.5 rounded uppercase tracking-widest">Swift_IBAN_Orchestration</span>
                  </div>
                  <textarea 
                    value={bankAccounts} 
                    onChange={e => setBankAccounts(e.target.value)} 
                    placeholder={lang === "ar" ? "أدخل تفاصيل الحساب البنكي والآيبان..." : "Specify IBAN, Swift, and Bank identifiers..."} 
                    className="min-h-[160px] w-full rounded-2xl bg-white/50 border border-border/50 p-6 text-sm font-bold ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all custom-scrollbar"
                  />
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-[20px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                      <p className="text-[11px] font-black text-emerald-700 uppercase tracking-widest leading-relaxed">
                          {lang === "ar" ? "بروتوكول تحصيل آمن" : "Secure Revenue Protocol"}
                      </p>
                      <p className="text-[10px] font-medium text-emerald-600/60 leading-relaxed max-w-md">
                          {lang === "ar" ? "يتم تأمين كافة بيانات الدفع وتشفيرها لضمان نزاهة التحويلات الإدارية القادمة من مالكي المنشآت." : "Production Note: Payment account orchestrators are secured using corporate-grade hashing to ensure administrative transaction integrity."}
                      </p>
                  </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
