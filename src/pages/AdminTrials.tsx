import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminOwners, useUpdateTrialDays, useCancelTrial, useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, Clock, XCircle, Save } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminTrials() {
  const { lang } = useLanguage();
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{lang === "ar" ? "الفترات التجريبية" : "Trial Periods"}</h1>
          <p className="text-sm text-muted-foreground">{lang === "ar" ? "إدارة الفترات التجريبية للمنشآت" : "Manage business trial periods"}</p>
        </div>

        {/* Default trial duration setting */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold text-card-foreground mb-3">{lang === "ar" ? "مدة الفترة التجريبية للمسجلين الجدد" : "Default Trial Duration for New Signups"}</h3>
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min="1"
              className="w-28"
              value={displayDefault}
              onChange={e => setDefaultTrialDays(e.target.value)}
              placeholder="30"
            />
            <span className="text-sm text-muted-foreground">{lang === "ar" ? "يوم" : "days"}</span>
            <Button size="sm" className="gap-1" onClick={handleSaveDefault} disabled={updateSetting.isPending}>
              <Save className="h-3.5 w-3.5" />
              {lang === "ar" ? "حفظ" : "Save"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {lang === "ar"
              ? "هذا التغيير يؤثر فقط على المنشآت الجديدة التي ستسجل بعد التعديل"
              : "This only affects new businesses that sign up after the change"}
          </p>
        </div>

        {/* Trial owners list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : trialOwners.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{lang === "ar" ? "المنشأة" : "Business"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{lang === "ar" ? "المالك" : "Owner"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{lang === "ar" ? "الأيام المتبقية" : "Days Left"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{lang === "ar" ? "تاريخ الانتهاء" : "Expires"}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{lang === "ar" ? "إجراء" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trialOwners.map((o: any) => {
                    const daysLeft = o.trial_ends_at
                      ? Math.max(0, Math.ceil((new Date(o.trial_ends_at).getTime() - Date.now()) / 86400000))
                      : 0;
                    return (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-card-foreground">{o.business_name || "-"}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{o.name}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${daysLeft <= 7 ? "bg-destructive/10 text-destructive" : "status-trial"}`}>
                            {daysLeft} {lang === "ar" ? "يوم" : "days"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {o.trial_ends_at ? new Date(o.trial_ends_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex bg-muted/30 rounded-md border border-border p-1">
                              <Input
                                type="number"
                                min="1"
                                placeholder={lang === "ar" ? "أيام" : "Days"}
                                className="w-16 h-8 text-xs border-0 bg-transparent focus-visible:ring-0"
                                value={trialDaysInput[o.user_id] || ""}
                                onChange={e => setTrialDaysInput(prev => ({ ...prev, [o.user_id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[10px] gap-1 rounded-s-none border-s border-border"
                                onClick={() => handleUpdateTrial(o.user_id)}
                                disabled={updateTrialDays.isPending || !trialDaysInput[o.user_id]}
                              >
                                {lang === "ar" ? "إضافة" : "Add"}
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-50"
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
                              {lang === "ar" ? "+ أسبوع" : "+ 1 Week"}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-8 text-xs gap-1"
                              onClick={() => handleCancelTrial(o.user_id)}
                              disabled={cancelTrial.isPending}
                            >
                              <XCircle className="h-3 w-3" />
                              {lang === "ar" ? "إلغاء" : "Cancel"}
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
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Clock className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">{lang === "ar" ? "لا توجد منشآت في الفترة التجريبية" : "No businesses in trial period"}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
