import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { useAllAds, useCreateAd, useUpdateAd, useDeleteAd } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Loader2, Image, Upload, Link as LinkIcon, Calendar } from "lucide-react";

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
      e.target.value = "";
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
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === "ar" ? "إدارة الإعلانات" : "Ads Management"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "أضف صور إعلانية وحدد مدة عرضها" : "Add ad banners and set display duration"}
            </p>
          </div>
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
            <Button asChild disabled={uploading} className="gap-2">
              <span>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {lang === "ar" ? "رفع صورة" : "Upload Image"}
              </span>
            </Button>
          </label>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : ads.length > 0 ? (
          <div className="space-y-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className={`rounded-xl border bg-card p-4 space-y-3 ${isExpired(ad) ? "border-destructive/30 opacity-60" : "border-border"}`}>
                <div className="flex gap-4">
                  <img src={ad.image_url} alt="Ad" className="h-24 w-40 rounded-lg object-cover border border-border" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch checked={ad.is_active} onCheckedChange={(v) => handleToggle(ad.id, v)} />
                        <span className="text-sm text-muted-foreground">
                          {isExpired(ad) ? (lang === "ar" ? "منتهي" : "Expired") :
                           isScheduled(ad) ? (lang === "ar" ? "مجدول" : "Scheduled") :
                           ad.is_active ? (lang === "ar" ? "مفعّل" : "Active") :
                           (lang === "ar" ? "معطّل" : "Inactive")}
                        </span>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(ad)} disabled={deleteAd.isPending}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Input defaultValue={ad.link || ""} placeholder={lang === "ar" ? "رابط (اختياري)" : "Link (optional)"}
                        dir="ltr" className="h-8 text-xs" onBlur={(e) => handleLinkChange(ad.id, e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Date scheduling */}
                <div className="flex items-center gap-2 pt-1">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground shrink-0">{lang === "ar" ? "مدة العرض:" : "Display period:"}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{lang === "ar" ? "يبدأ من" : "Starts at"}</label>
                    <Input type="datetime-local" className="h-8 text-xs" dir="ltr"
                      defaultValue={ad.starts_at ? new Date(ad.starts_at).toISOString().slice(0, 16) : ""}
                      onBlur={(e) => handleDateChange(ad.id, "starts_at", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{lang === "ar" ? "ينتهي في" : "Ends at"}</label>
                    <Input type="datetime-local" className="h-8 text-xs" dir="ltr"
                      defaultValue={ad.ends_at ? new Date(ad.ends_at).toISOString().slice(0, 16) : ""}
                      onBlur={(e) => handleDateChange(ad.id, "ends_at", e.target.value ? new Date(e.target.value).toISOString() : "")} />
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {lang === "ar" ? "اترك 'ينتهي في' فارغاً للعرض بدون حد زمني" : "Leave 'Ends at' empty for unlimited display"}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Image className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">{lang === "ar" ? "لا توجد إعلانات" : "No ads yet"}</p>
            <p className="text-xs mt-1">{lang === "ar" ? "ارفع صورة إعلانية لتبدأ" : "Upload an ad image to get started"}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
