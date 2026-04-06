import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminOwners, useUpdateTrialDays, useCancelTrial, useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, Clock, XCircle, Save, Sparkles, Building2, User, Calendar, History, Settings2, Plus, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function AdminTrials() {
  const { lang, t } = useLanguage();
  const { data: owners = [], isLoading } = useAdminOwners();
  const updateTrialDays = useUpdateTrialDays();
  const cancelTrial = useCancelTrial();
  const { data: settings } = useAppSettings();
  const updateSetting = useUpdateSetting();
  const { toast } = useToast();
  const [trialDaysInput, setTrialDaysInput] = useState<Record<string, string>>({});
  const [defaultTrialDays, setDefaultTrialDays] = useState<string>("");

  const currentDefault = settings?.trial_duration_days || "30";
  const displayDefault = defaultTrialDays || currentDefault;

  // Filter only trial users
  const trialOwners = owners.filter((o: any) => o.subscription_status === "trial");

  const handleUpdateTrial = async (userId: string) => {
    const days = parseInt(trialDaysInput[userId] || "0");
    if (days < 0) return;
    try {
      await updateTrialDays.mutateAsync({ userId, days });
      toast({ title: lang === "ar" ? "تم التحديث" : "Updated", description: lang === "ar" ? `تم تحديث الفترة التجريبية إلى ${days} يوم` : `Trial updated to ${days} days` });
      setTrialDaysInput(prev => ({ ...prev, [userId]: "" }));
    } catch {
      toast({ variant: "destructive", title: lang === "ar" ? "خطأ" : "Error" });
    }
  };

  const handleCancelTrial = async (userId: string) => {
    try {
      await cancelTrial.mutateAsync({ userId });
      toast({ title: lang === "ar" ? "تم الإلغاء" : "Cancelled", description: lang === "ar" ? "تم إلغاء الفترة التجريبية" : "Trial cancelled" });
    } catch {
      toast({ variant: "destructive", title: lang === "ar" ? "خطأ" : "Error" });
    }
  };

  const handleSaveDefault = async () => {
    try {
      await updateSetting.mutateAsync({ key: "trial_duration_days", value: displayDefault });
      toast({ title: lang === "ar" ? "تم الحفظ" : "Saved", description: lang === "ar" ? `الفترة التجريبية الافتراضية: ${displayDefault} يوم` : `Default trial: ${displayDefault} days` });
      setDefaultTrialDays("");
    } catch {
      toast({ variant: "destructive", title: lang === "ar" ? "خطأ" : "Error" });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center ring-1 ring-amber-500/20 shadow-sm">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{lang === "ar" ? "الفترات التجريبية" : "Trial Periods"}</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                {lang === "ar" ? "إدارة فترات التجربة المجانية للمنشآت" : "Oversee free trial lifecycle for businesses"}
              </p>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[150%] bg-amber-500/5 rotate-12 blur-[100px] pointer-events-none" />
        </div>

        {/* Configuration Card */}
        <div className="group relative rounded-[32px] border border-border/50 bg-card/60 backdrop-blur-sm p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                  {lang === "ar" ? "إعدادات المدة الافتراضية" : "Default Duration Settings"}
                </h3>
              </div>
              <p className="text-xs font-medium text-muted-foreground ps-6">
                {lang === "ar" ? "تحديد الأيام التلقائية لكل منشأة جديدة" : "Set automatic trial days for all new signups"}
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-white/50 border border-border/30 rounded-2xl p-2 sm:p-3 shadow-none focus-within:ring-1 focus-within:ring-primary/30 transition-all">
              <div className="flex items-center px-2">
                <Input
                  type="number"
                  min="1"
                  className="h-10 w-24 border-0 bg-transparent focus-visible:ring-0 font-black text-lg text-center"
                  value={displayDefault}
                  onChange={e => setDefaultTrialDays(e.target.value)}
                  placeholder="30"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ms-2 opacity-60">{lang === "ar" ? "يوم" : "days"}</span>
              </div>
              <Button onClick={handleSaveDefault} disabled={updateSetting.isPending} className="h-10 rounded-xl px-6 font-bold gap-2 shadow-lg shadow-primary/20 group">
                <Save className="h-4 w-4 transition-transform group-hover:scale-110" />
                {lang === "ar" ? "حفظ" : "Save"}
              </Button>
            </div>
          </div>
          <div className="absolute bottom-0 right-0 h-24 w-24 bg-primary/5 rotate-45 translate-x-12 translate-y-12 blur-2xl group-hover:bg-primary/10 transition-colors" />
        </div>

        {/* List Section */}
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : trialOwners.length > 0 ? (
          <div className="rounded-[32px] border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "المنشأة" : "Business"}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "الحالة" : "Status"}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "تاريخ الانتهاء" : "Expiry Date"}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "إجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {trialOwners.map((o: any) => {
                    const daysLeft = o.trial_ends_at
                      ? Math.max(0, Math.ceil((new Date(o.trial_ends_at).getTime() - Date.now()) / 86400000))
                      : 0;
                    return (
                      <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors group">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-muted/20 flex items-center justify-center group-hover:scale-105 transition-transform">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground text-sm tracking-tight">{o.business_name || "-"}</p>
                              <div className="flex items-center gap-1.5 opacity-60">
                                <User className="h-3 w-3" />
                                <span className="text-[10px] font-bold uppercase tracking-wider">{o.name}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className={`w-fit inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black border uppercase tracking-wider ${
                            daysLeft <= 7 
                              ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          }`}>
                            <History className="h-3 w-3" />
                            {daysLeft} {lang === "ar" ? "يوم متبقي" : "days left"}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
                              {o.trial_ends_at ? new Date(o.trial_ends_at).toLocaleDateString() : "-"}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{lang === "ar" ? "نهاية التجربة" : "Expiry Date"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 flex-wrap text-card-foreground">
                            <div className="flex items-center bg-white border border-border/50 rounded-xl p-0.5 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                              <Input
                                type="number"
                                min="1"
                                placeholder={lang === "ar" ? "يوم" : "Day"}
                                className="w-14 h-9 border-0 bg-transparent focus-visible:ring-0 text-center font-black text-xs"
                                value={trialDaysInput[o.user_id] || ""}
                                onChange={e => setTrialDaysInput(prev => ({ ...prev, [o.user_id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-9 px-4 text-[10px] font-black uppercase rounded-lg group/btn gap-2"
                                onClick={() => handleUpdateTrial(o.user_id)}
                                disabled={updateTrialDays.isPending || !trialDaysInput[o.user_id]}
                              >
                                {lang === "ar" ? "إضافة" : "Add"}
                                <Plus className="h-3 w-3 group-hover/btn:scale-125 transition-transform" />
                              </Button>
                            </div>

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 px-4 rounded-xl text-[10px] font-black uppercase gap-2 border-blue-500/20 text-blue-600 hover:bg-blue-50 transition-all"
                              onClick={async () => {
                                try {
                                  await updateTrialDays.mutateAsync({ userId: o.user_id, days: 7 });
                                  toast({ title: lang === "ar" ? "تم التحديث" : "Updated", description: lang === "ar" ? "تمت إضافة أسبوع للفترة التجريبية" : "Added 1 week to trial" });
                                } catch {
                                  toast({ variant: "destructive", title: lang === "ar" ? "خطأ" : "Error" });
                                }
                              }}
                              disabled={updateTrialDays.isPending}
                            >
                              <Sparkles className="h-3 w-3" />
                              {lang === "ar" ? "+ أسبوع" : "+ 1 Week"}
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-10 w-10 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                              onClick={() => handleCancelTrial(o.user_id)}
                              disabled={cancelTrial.isPending}
                              title={lang === "ar" ? "إلغاء الفترة التجريبية" : "Cancel trial"}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-card/30 rounded-[40px] border border-dashed border-border/50 text-muted-foreground group">
            <div className="h-20 w-20 rounded-full bg-muted/5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center mb-4 text-muted-foreground/20">
              <History className="h-10 w-10" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest opacity-40">{lang === "ar" ? "لا توجد منشآت تجريبية" : "No trials active"}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
