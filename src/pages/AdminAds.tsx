import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAllAds, useCreateAd, useUpdateAd, useDeleteAd } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Image as ImageIcon, Upload, Link as LinkIcon, Calendar, Sparkles, Megaphone, ExternalLink, Activity } from "lucide-react";
import { AdCardSkeleton } from "@/components/SkeletonLoader";

export default function AdminAds() {
  const { t, lang } = useLanguage();
  const { data: ads = [], isLoading } = useAllAds();
  const createAd = useCreateAd();
  const updateAd = useUpdateAd();
  const deleteAd = useDeleteAd();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("ads").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("ads").getPublicUrl(path);
      await createAd.mutateAsync({ image_url: urlData.publicUrl });
      toast({ title: t("common.success") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (ad: any) => {
    try {
      const url = ad.image_url as string;
      const parts = url.split("/ads/");
      if (parts[1]) {
        await supabase.storage.from("ads").remove([decodeURIComponent(parts[1])]);
      }
      await deleteAd.mutateAsync(ad.id);
      toast({ title: t("common.success") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    await updateAd.mutateAsync({ id, is_active: active });
  };

  const handleLinkChange = async (id: string, link: string) => {
    await updateAd.mutateAsync({ id, link: link || undefined });
  };

  const handleDateChange = async (id: string, field: "starts_at" | "ends_at", value: string) => {
    await updateAd.mutateAsync({ id, [field]: value || null });
  };

  const isExpired = (ad: any) => {
    if (!ad.ends_at) return false;
    return new Date(ad.ends_at) < new Date();
  };

  const isScheduled = (ad: any) => {
    if (!ad.starts_at) return false;
    return new Date(ad.starts_at) > new Date();
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
              <Megaphone className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                {lang === "ar" ? "إدارة الإعلانات" : "Ads Management"}
              </h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                {lang === "ar" ? "تحكم في بانرات التطبيق ومدة عرضها" : "Control app banners and visibility"}
              </p>
            </div>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button asChild disabled={uploading} className="h-11 rounded-2xl gap-2 px-6 shadow-lg shadow-primary/20 group cursor-pointer transition-all active:scale-95">
              <span>
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5 group-hover:-translate-y-0.5 transition-transform" />}
                <span className="font-bold">{lang === "ar" ? "رفع إعلان جديد" : "Upload New Ad"}</span>
              </span>
            </Button>
          </label>
        </div>

        {isLoading ? (
          <AdCardSkeleton />
        ) : ads.length > 0 ? (
          <div className="space-y-6">
            {ads.map((ad: any) => (
              <div 
                key={ad.id} 
                className={`group relative rounded-[32px] border transition-all duration-500 overflow-hidden bg-card/60 backdrop-blur-sm p-5 sm:p-6 flex flex-col sm:flex-row gap-6 shadow-sm hover:shadow-xl hover:translate-y-[-2px] ${
                  isExpired(ad) ? "border-destructive/20 opacity-70 grayscale-[0.3]" : "border-border/50 hover:border-primary/30"
                }`}
              >
                {/* Image Container */}
                <div className="relative h-40 sm:h-auto sm:w-64 rounded-2xl overflow-hidden border border-border/50 bg-muted/20 shrink-0 group-hover:ring-1 group-hover:ring-primary/20 transition-all">
                  <img src={ad.image_url} alt="Ad Banner" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  {isExpired(ad) && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center p-4">
                      <span className="bg-destructive/90 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                        {lang === "ar" ? "إعلان منتهي" : "Expired Ad"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                          isExpired(ad) ? "bg-destructive/10 text-destructive border-destructive/20" :
                          isScheduled(ad) ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          ad.is_active ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          "bg-muted text-muted-foreground border-border"
                        }`}>
                          <Activity className="h-3 w-3" />
                          {isExpired(ad) ? (lang === "ar" ? "منتهي" : "Expired") :
                           isScheduled(ad) ? (lang === "ar" ? "مجدول" : "Scheduled") :
                           ad.is_active ? (lang === "ar" ? "نشط" : "Active") :
                           (lang === "ar" ? "غير نشط" : "Inactive")}
                        </div>
                        <Switch 
                          checked={ad.is_active} 
                          onCheckedChange={(v) => handleToggle(ad.id, v)}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                        onClick={() => handleDelete(ad)} 
                        disabled={deleteAd.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative group/input">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input 
                        defaultValue={ad.link || ""} 
                        placeholder={lang === "ar" ? "أدخل رابط الإعلان (اختياري)..." : "Set landing page link (optional)..."}
                        dir="ltr" 
                        className="h-10 rounded-xl ps-9 text-xs border-border/50 bg-white/40 focus:ring-primary/20 shadow-none" 
                        onBlur={(e) => handleLinkChange(ad.id, e.target.value)} 
                      />
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  <div className="mt-6 space-y-3 pt-4 border-t border-dashed border-border/50">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-primary" />
                      <span className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground">
                        {lang === "ar" ? "جدولة العرض" : "Visibility Schedule"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "بداية العرض" : "Start Date"}</label>
                        <Input 
                          type="datetime-local" 
                          className="h-9 rounded-xl text-[10px] font-bold bg-white/50 border-border/30 focus:ring-primary/20" 
                          dir="ltr"
                          defaultValue={ad.starts_at ? new Date(ad.starts_at).toISOString().slice(0, 16) : ""}
                          onBlur={(e) => handleDateChange(ad.id, "starts_at", e.target.value ? new Date(e.target.value).toISOString() : "")} 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "نهاية العرض" : "Expiry Date"}</label>
                        <Input 
                          type="datetime-local" 
                          className="h-9 rounded-xl text-[10px] font-bold bg-white/50 border-border/30 focus:ring-primary/20" 
                          dir="ltr"
                          defaultValue={ad.ends_at ? new Date(ad.ends_at).toISOString().slice(0, 16) : ""}
                          onBlur={(e) => handleDateChange(ad.id, "ends_at", e.target.value ? new Date(e.target.value).toISOString() : "")} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-card/30 rounded-[40px] border border-dashed border-border/50 text-muted-foreground group">
            <div className="h-20 w-20 rounded-full bg-muted/5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center mb-4">
              <ImageIcon className="h-10 w-10 opacity-10" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest opacity-40">{lang === "ar" ? "لا توجد إعلانات" : "No ads found"}</p>
            <p className="text-[10px] font-medium mt-1 uppercase tracking-tight text-center">
              {lang === "ar" ? "ارفع صورة إعلانية بمقاسات مناسبة لتبدأ" : "Upload an ad banner to start promoting"}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
