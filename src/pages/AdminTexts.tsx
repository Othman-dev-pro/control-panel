import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Save, Loader2, Type, Languages, Sparkles, Layout, Info } from "lucide-react";
import { StatsSkeleton } from "@/components/SkeletonLoader";

export default function AdminTexts() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings = [], isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [landingTextAr, setLandingTextAr] = useState("");
  const [landingTextEn, setLandingTextEn] = useState("");
  const [aboutTextAr, setAboutTextAr] = useState("");
  const [aboutTextEn, setAboutTextEn] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setLandingTextAr(settings["landing_text_ar"] || "");
      setLandingTextEn(settings["landing_text_en"] || "");
      setAboutTextAr(settings["about_text_ar"] || "");
      setAboutTextEn(settings["about_text_en"] || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "landing_text_ar", value: landingTextAr }),
        updateSetting.mutateAsync({ key: "landing_text_en", value: landingTextEn }),
        updateSetting.mutateAsync({ key: "about_text_ar", value: aboutTextAr }),
        updateSetting.mutateAsync({ key: "about_text_en", value: aboutTextEn }),
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
              <Type className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                {lang === "ar" ? "نصوص المنصة" : "Content Management"}
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                {lang === "ar" ? "تعديل النصوص الترحيبية والتعريفية" : "UI copy orchestration and localization"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {lang === "ar" ? "حفظ التغييرات" : "Commit Copy"}
          </Button>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-8 pb-20">
            {/* Landing Text Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-border/30 pb-6">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "النص الترحيبي" : "Landing Narrative"}</h2>
                </div>
                <Languages className="h-5 w-5 text-muted-foreground opacity-20" />
              </div>
              
              <div className="grid gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{lang === "ar" ? "المحتوى بالعربية (الرئيسية)" : "Arabic Narrative (Main Hub)"}</label>
                  <textarea 
                    value={landingTextAr} 
                    onChange={e => setLandingTextAr(e.target.value)} 
                    placeholder="نص ترحيبي..."
                    className="min-h-[140px] w-full rounded-2xl bg-white/50 border border-border/50 p-6 text-sm font-bold ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all custom-scrollbar"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{lang === "ar" ? "المحتوى بالإنجليزية (الرئيسية)" : "English Narrative (Main Hub)"}</label>
                  <textarea 
                    value={landingTextEn} 
                    onChange={e => setLandingTextEn(e.target.value)} 
                    placeholder="Landing text..." 
                    dir="ltr"
                    className="min-h-[140px] w-full rounded-2xl bg-white/50 border border-border/50 p-6 text-sm font-bold ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all custom-scrollbar"
                  />
                </div>
              </div>
            </div>

            {/* About Text Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-border/30 pb-6">
                <div className="flex items-center gap-3">
                  <Info className="h-6 w-6 text-primary" />
                  <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "عن المنصة" : "About Strategy"}</h2>
                </div>
                <Layout className="h-5 w-5 text-muted-foreground opacity-20" />
              </div>
              
              <div className="grid gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{lang === "ar" ? "المحتوى بالعربية (من نحن)" : "Arabic Strategy (About Page)"}</label>
                  <textarea 
                    value={aboutTextAr} 
                    onChange={e => setAboutTextAr(e.target.value)} 
                    placeholder="نص عن المنصة..."
                    className="min-h-[180px] w-full rounded-2xl bg-white/50 border border-border/50 p-6 text-sm font-bold ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all custom-scrollbar"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">{lang === "ar" ? "المحتوى بالإنجليزية (من نحن)" : "English Strategy (About Page)"}</label>
                  <textarea 
                    value={aboutTextEn} 
                    onChange={e => setAboutTextEn(e.target.value)} 
                    placeholder="About the platform..." 
                    dir="ltr"
                    className="min-h-[180px] w-full rounded-2xl bg-white/50 border border-border/50 p-6 text-sm font-bold ring-offset-background placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 transition-all custom-scrollbar"
                  />
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-muted/20 border border-dashed border-border flex items-start gap-4">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed italic">
                      {lang === "ar" ? "ملاحظة: سيتم تحديث محتوى النصوص تلقائياً في واجهات المستخدم والتطبيقات الجوالة المرتبطة بقاعدة البيانات فور حفظ التغييرات." : "Strategic Localization: Narrative copy and platform strategies will be automatically synchronized across all client endpoints and mobile terminals upon save."}
                  </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
