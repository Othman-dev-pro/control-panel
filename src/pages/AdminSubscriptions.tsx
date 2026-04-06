import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminOwners, useActivateSubscription, usePauseSubscription } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, CreditCard, Pause, Play } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminSubscriptions() {
  const { t, lang } = useLanguage();
  const { data: owners = [], isLoading } = useAdminOwners();
  const activateSubscription = useActivateSubscription();
  const pauseSubscription = usePauseSubscription();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [customDays, setCustomDays] = useState<Record<string, string>>({});

  const statusStyles: Record<string, string> = { trial: "status-trial", active: "status-active", expired: "status-expired" };
  const statusLabels: Record<string, string> = { trial: t("admin.trial"), active: t("admin.active"), expired: t("admin.expired") };

  // Show all including trial
  const filtered = filter === "all" ? owners : owners.filter((o: any) => o.subscription_status === filter);

  const handleActivate = async (userId: string, days: number) => {
    if (!days || days <= 0) {
      toast({ variant: "destructive", title: t("common.error"), description: lang === "ar" ? "أدخل عدد أيام صحيح" : "Enter valid days" });
      return;
    }
    try {
      await activateSubscription.mutateAsync({ userId, days });
      toast({ title: t("common.success"), description: t("admin.activated") });
      setCustomDays(prev => ({ ...prev, [userId]: "" }));
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const handlePause = async (userId: string) => {
    try {
      await pauseSubscription.mutateAsync({ userId });
      toast({ title: t("common.success"), description: lang === "ar" ? "تم إيقاف الاشتراك" : "Subscription paused" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("nav.subscriptions")}</h1>
            <p className="text-sm text-muted-foreground">{t("admin.subscriptionsSub")}</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.all")}</SelectItem>
              <SelectItem value="trial">{t("admin.trial")}</SelectItem>
              <SelectItem value="active">{t("admin.active")}</SelectItem>
              <SelectItem value="expired">{t("admin.expired")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{t("admin.business")}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{t("admin.owner")}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{t("admin.status")}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{t("admin.subscriptionDate")}</th>
                    <th className="px-4 py-3 text-start font-semibold text-muted-foreground">{t("admin.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((o: any) => {
                    const endDate = o.subscription_ends_at || o.trial_ends_at;
                    const daysLeft = endDate ? Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000)) : 0;
                    return (
                      <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 font-medium text-card-foreground">{o.business_name || "-"}</td>
                        <td className="px-4 py-3.5 text-muted-foreground">{o.name}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[o.subscription_status] || "status-trial"}`}>
                            {statusLabels[o.subscription_status] || o.subscription_status}
                          </span>
                          {daysLeft > 0 && (
                            <span className="text-xs text-muted-foreground ms-2">({daysLeft} {lang === "ar" ? "يوم" : "days"})</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground">
                          {endDate ? new Date(endDate).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex bg-muted/30 rounded-md border border-border p-1">
                              <Input
                                type="number"
                                min="1"
                                placeholder={lang === "ar" ? "أيام" : "Days"}
                                className="w-16 h-8 text-xs border-0 bg-transparent focus-visible:ring-0"
                                value={customDays[o.user_id] || ""}
                                onChange={(e) => setCustomDays(prev => ({ ...prev, [o.user_id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="h-8 text-[10px] gap-1 rounded-s-none border-s border-border"
                                onClick={() => handleActivate(o.user_id, parseInt(customDays[o.user_id] || "0"))}
                                disabled={activateSubscription.isPending || !customDays[o.user_id]}
                              >
                                {lang === "ar" ? "إضافة" : "Add"}
                              </Button>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handleActivate(o.user_id, 30)}
                              disabled={activateSubscription.isPending}
                            >
                              <Play className="h-3 w-3" />
                              {lang === "ar" ? "+ شهر" : "+ 1 Month"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs gap-1 border-blue-500/30 text-blue-600 hover:bg-blue-50"
                              onClick={() => handleActivate(o.user_id, 365)}
                              disabled={activateSubscription.isPending}
                            >
                              {lang === "ar" ? "+ سنة" : "+ 1 Year"}
                            </Button>
                            {o.subscription_status === "active" && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 text-xs gap-1"
                                onClick={() => handlePause(o.user_id)}
                                disabled={pauseSubscription.isPending}
                                title={lang === "ar" ? "إلغاء الاشتراك وجعله منتهي" : "Cancel subscription entirely"}
                              >
                                <Pause className="h-3 w-3" />
                                {lang === "ar" ? "إلغاء الاشتراك" : "Cancel"}
                              </Button>
                            )}
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
            <CreditCard className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">{t("common.noData")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
