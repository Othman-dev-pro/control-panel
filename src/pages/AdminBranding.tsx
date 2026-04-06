import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Save, Upload, Image } from "lucide-react";

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
      toast({ title: t("common.success"), description: lang === "ar" ? "تم رفع الأيقونة - اضغط حفظ لتطبيق" : "Icon uploaded - press Save to apply" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setUploadingIcon(false);
      e.target.value = "";
    }
  };

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === "ar" ? "هوية التطبيق" : "App Branding"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "تخصيص اسم التطبيق وأيقونته" : "Customize app name and icon"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>

        {/* App Icon */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
            <Image className="h-5 w-5 text-primary" />
            {lang === "ar" ? "أيقونة التطبيق" : "App Icon"}
          </h2>
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-muted overflow-hidden">
              {appIcon ? (
                <img src={appIcon} alt="App Icon" className="h-full w-full object-cover" />
              ) : (
                <Shield className="h-10 w-10 text-primary" />
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {lang === "ar" ? "الأيقونة الحالية" : "Current Icon"}
              </p>
              <p className="text-xs text-muted-foreground">
                {lang === "ar" ? "ارفع صورة مربعة بجودة عالية" : "Upload a high quality square image"}
              </p>
              <label className="cursor-pointer inline-block">
                <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={uploadingIcon} />
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
                  {uploadingIcon ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  {lang === "ar" ? "رفع أيقونة" : "Upload Icon"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* App Name */}
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold text-card-foreground">
            {lang === "ar" ? "اسم التطبيق" : "App Name"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {lang === "ar" ? "الاسم بالعربي" : "Arabic Name"}
              </label>
              <Input value={appNameAr} onChange={e => setAppNameAr(e.target.value)} placeholder="ديبت فلو" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {lang === "ar" ? "الاسم بالإنجليزي" : "English Name"}
              </label>
              <Input value={appNameEn} onChange={e => setAppNameEn(e.target.value)} placeholder="DebtFlow" dir="ltr" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {lang === "ar" ? "سيظهر الاسم والأيقونة في جميع واجهات التطبيق" : "Name and icon appear across all app pages"}
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
