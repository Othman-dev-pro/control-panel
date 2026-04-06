import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Save, Upload, Image as ImageIcon, Sparkles, Layout, Globe } from "lucide-react";
import { StatsSkeleton } from "@/components/SkeletonLoader";

export default function AdminBranding() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [appNameAr, setAppNameAr] = useState("");
  const [appNameEn, setAppNameEn] = useState("");
  const [appIcon, setAppIcon] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    if (settings) {
      setAppNameAr(settings["app_name_ar"] || "ديبت فلو");
      setAppNameEn(settings["app_name_en"] || "DebtFlow");
      setAppIcon(settings["app_icon_url"] || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "app_name_ar", value: appNameAr }),
        updateSetting.mutateAsync({ key: "app_name_en", value: appNameEn }),
        ...(appIcon ? [updateSetting.mutateAsync({ key: "app_icon_url", value: appIcon })] : []),
      ]);
      toast({ title: t("common.success"), description: t("settings.saved") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setSaving(false);
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIcon(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `app-icon-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("ads").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("ads").getPublicUrl(path);
      setAppIcon(urlData.publicUrl);
      toast({ title: t("common.success"), description: lang === "ar" ? "تم رفع الأيقونة بنجاح" : "Icon uploaded successfully" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setUploadingIcon(false);
      e.target.value = "";
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
                {lang === "ar" ? "هوية التطبيق" : "App Branding"}
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                {lang === "ar" ? "تخصيص اسم التطبيق وأيقونته برمجياً" : "Programmatic custom identity orchestration"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-8">
            {/* Visual Identity Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <ImageIcon className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "الهوية البصرية" : "Visual Identity"}</h2>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-10">
                <div className="relative group">
                    <div className="h-32 w-32 rounded-[32px] bg-white flex items-center justify-center shadow-2xl ring-1 ring-border/50 overflow-hidden group-hover:scale-105 transition-transform duration-500">
                        {appIcon ? (
                            <img src={appIcon} alt="App Icon" className="h-full w-full object-cover" />
                        ) : (
                            <Shield className="h-12 w-12 text-primary/20" />
                        )}
                    </div>
                    {uploadingIcon && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-[32px] flex items-center justify-center animate-pulse">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-4">
                  <h3 className="font-black text-lg text-foreground">{lang === "ar" ? "أيقونة التطبيق الرسمية" : "Official Platform Icon"}</h3>
                  <p className="text-sm font-medium text-muted-foreground leading-relaxed max-w-sm">
                    {lang === "ar" ? "ارفع صورة مربعة عالية الدقة. سيتم استخدام هذه الأيقونة في شريط التنقل والتقارير والرسائل." : "Upload a high-fidelity square asset. This icon will orchestrate branding across navigation logs, reports, and communications."}
                  </p>
                  <label className="cursor-pointer inline-flex group/label">
                    <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploadingIcon} />
                    <span className="h-12 px-6 rounded-2xl bg-primary/5 text-primary border border-primary/20 flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-primary/10 transition-all">
                      <Upload className="h-4 w-4" />
                      {lang === "ar" ? "رفع أيقونة جديدة" : "Deploy New Icon"}
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Platform Naming Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <Globe className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "تسمية المنصة" : "Platform Naming"}</h2>
              </div>
              
              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {lang === "ar" ? "الاسم بالعربية" : "Arabic Localization"}
                    </label>
                    <span className="text-[8px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest font-mono">AR_GLOBAL</span>
                  </div>
                  <Input 
                    value={appNameAr} 
                    onChange={e => setAppNameAr(e.target.value)} 
                    placeholder="ديبت فلو" 
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                        {lang === "ar" ? "الاسم بالإنجليزية" : "English Localization"}
                    </label>
                    <span className="text-[8px] font-black text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-widest font-mono">EN_GLOBAL</span>
                  </div>
                  <Input 
                    value={appNameEn} 
                    onChange={e => setAppNameEn(e.target.value)} 
                    placeholder="DebtFlow" 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black tracking-tight transition-all"
                  />
                </div>
              </div>
              
              <div className="p-6 rounded-[24px] bg-muted/30 border border-dashed border-border/50 flex items-start gap-4">
                  <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      <Layout className="h-4 w-4 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                      {lang === "ar" ? "ملاحظة: سيتم تحديث تسمية المنصة وهوية العلامة التجارية تلقائياً في كافة واجهات النظام ولوحة التحكم فور حفظ التغييرات." : "Strategic Note: Platform naming and brand identity will be automatically propagated across all system interfaces and dashboards upon save."}
                  </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
