import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Phone, Mail, MessageSquare, Save, Loader2, Headset, Share2, Globe, Send } from "lucide-react";
import { StatsSkeleton } from "@/components/SkeletonLoader";

export default function AdminContact() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setPhone(settings["admin_phone"] || "");
      setEmail(settings["admin_email"] || "");
      setWhatsapp(settings["admin_whatsapp"] || "");
      setTelegram(settings["admin_telegram"] || "");
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "admin_phone", value: phone }),
        updateSetting.mutateAsync({ key: "admin_email", value: email }),
        updateSetting.mutateAsync({ key: "admin_whatsapp", value: whatsapp }),
        updateSetting.mutateAsync({ key: "admin_telegram", value: telegram }),
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
              <Headset className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                {lang === "ar" ? "بيانات التواصل" : "Contact Logistics"}
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                {lang === "ar" ? "إدارة قنوات الدعم الفني الرسمية" : "Official support channel orchestration"}
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg" className="h-14 px-8 rounded-[24px] font-black uppercase text-xs tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all relative z-10">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {lang === "ar" ? "تحديث القنوات" : "Commit Channels"}
          </Button>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-8">
            {/* Communication Hub Block */}
            <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-10">
              <div className="flex items-center gap-3 border-b border-border/30 pb-6">
                <Share2 className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "مركز الاتصال" : "Communication Hub"}</h2>
              </div>
              
              <div className="grid gap-10 sm:grid-cols-2">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    {lang === "ar" ? "رقم الهاتف الرسمي" : "Official Hotline"}
                  </label>
                  <Input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    placeholder="+966..." 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    {lang === "ar" ? "البريد الإلكتروني" : "Corporate Email"}
                  </label>
                  <Input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="support@example.com" 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2 text-emerald-600">
                    <MessageSquare className="h-3 w-3" />
                    {lang === "ar" ? "رابط الواتساب" : "Direct WhatsApp Link"}
                  </label>
                  <Input 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                    placeholder="https://wa.me/..." 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60 flex items-center gap-2 text-blue-500">
                    <Send className="h-3 w-3" />
                    {lang === "ar" ? "رابط التليجرام" : "Direct Telegram Link"}
                  </label>
                  <Input 
                    value={telegram} 
                    onChange={e => setTelegram(e.target.value)} 
                    placeholder="https://t.me/..." 
                    dir="ltr"
                    className="h-14 rounded-2xl bg-white/50 border-border/50 focus:ring-primary/20 font-black transition-all"
                  />
                </div>
              </div>

              <div className="p-8 rounded-[32px] bg-primary/5 border border-primary/10 flex items-center gap-6">
                  <div className="h-14 w-14 rounded-[20px] bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Globe className="h-7 w-7" />
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground leading-relaxed max-w-sm">
                      {lang === "ar" ? "سيتم عرض قنوات التواصل هذه لمالكي المنشآت والزبائن في صفحة الدعم الفني داخل التطبيق." : "Strategic Logistics: All orchestrated support channels will be surfaced to business owners and clients through the in-app help desk terminals."}
                  </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
