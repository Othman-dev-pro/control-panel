import { useLanguage } from "@/contexts/LanguageContext";
import { 
  useAdminOwners, 
  useActivateSubscription, 
  usePauseSubscription, 
  useResumeSubscription, 
  useResetSubscription 
} from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2, CreditCard, Pause, Play, RotateCcw, Trash2, ShieldCheck, Filter, User, Building2, Calendar, Clock, Search, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/SkeletonLoader";

export default function AdminSubscriptions() {
  const { t, lang } = useLanguage();
  const { data: owners = [], isLoading } = useAdminOwners();
  const activateSubscription = useActivateSubscription();
  const pauseSubscription = usePauseSubscription();
  const resumeSubscription = useResumeSubscription();
  const resetSubscription = useResetSubscription();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [customDays, setCustomDays] = useState<Record<string, string>>({});

  const statusStyles: Record<string, string> = { 
    trial: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", 
    expired: "bg-destructive/10 text-destructive border-destructive/20 text-muted-foreground" 
  };
  
  const statusLabels: Record<string, string> = { 
    trial: t("admin.trial"), 
    active: t("admin.active"), 
    expired: t("admin.expired") 
  };

  const filtered = owners.filter((o: any) => {
    const matchesFilter = filter === "all" || o.subscription_status === filter;
    const matchesSearch = !search || 
      o.business_name?.toLowerCase().includes(search.toLowerCase()) || 
      o.name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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

  const handleResume = async (userId: string) => {
    try {
      await resumeSubscription.mutateAsync({ userId });
      toast({ title: t("common.success"), description: lang === "ar" ? "تم مواصلة الاشتراك" : "Subscription resumed" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const handleReset = async (userId: string) => {
    if (!window.confirm(lang === "ar" ? "هل أنت متأكد من تصفير الاشتراك؟ سيصبح الاشتراك 0 أيام فوراً." : "Are you sure you want to reset the subscription? It will become 0 days immediately.")) return;
    try {
      await resetSubscription.mutateAsync({ userId });
      toast({ title: t("common.success"), description: lang === "ar" ? "تم تصفير الاشتراك بنجاح" : "Subscription reset successfully" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center ring-1 ring-emerald-500/20 shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{t("nav.subscriptions")}</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                {t("admin.subscriptionsSub")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10">
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder={t("common.search")} 
                className="h-10 rounded-xl ps-9 border-border/50 bg-white/50 focus:ring-primary/20 transition-all font-medium text-xs" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted/30 border border-border/50">
                <Filter className="h-4 w-4 text-muted-foreground" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-10 w-full sm:w-36 rounded-xl border-border/50 bg-white/50 font-bold text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50 shadow-xl overflow-hidden">
                  <SelectItem value="all" className="text-xs font-bold">{t("admin.all")}</SelectItem>
                  <SelectItem value="trial" className="text-xs font-bold">{t("admin.trial")}</SelectItem>
                  <SelectItem value="active" className="text-xs font-bold">{t("admin.active")}</SelectItem>
                  <SelectItem value="expired" className="text-xs font-bold">{t("admin.expired")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[30%] h-[150%] bg-emerald-500/5 rotate-12 blur-[100px] pointer-events-none" />
        </div>

        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : filtered.length > 0 ? (
          <div className="rounded-[32px] border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20">
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.business")}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.status")}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.subscriptionDate")}</th>
                    <th className="px-6 py-4 text-start text-[11px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.action")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map((o: any) => {
                    const endDate = o.subscription_ends_at || o.trial_ends_at;
                    const now = new Date();
                    const end = endDate ? new Date(endDate) : null;
                    const daysLeft = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : 0;
                    const canResume = o.subscription_status === "expired" && end && end > now;

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
                          <div className="flex flex-col gap-1.5">
                            <span className={`w-fit inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black border uppercase tracking-wider ${statusStyles[o.subscription_status] || statusStyles.trial}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                              {statusLabels[o.subscription_status] || o.subscription_status}
                            </span>
                            {daysLeft > 0 && (
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase opacity-60 ps-1">
                                <Clock className="h-3 w-3" />
                                {daysLeft} {lang === "ar" ? "يوم متبقي" : "days left"}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                              <Calendar className="h-3.5 w-3.5 text-primary opacity-60" />
                              {endDate ? new Date(endDate).toLocaleDateString() : "-"}
                            </div>
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{lang === "ar" ? "تاريخ النهاية" : "Expiry Date"}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2 flex-wrap max-w-[400px]">
                            {/* Custom Activation */}
                            <div className="flex items-center bg-white border border-border/50 rounded-xl p-0.5 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
                              <Input
                                type="number"
                                min="1"
                                placeholder="00"
                                className="w-14 h-9 border-0 bg-transparent focus-visible:ring-0 text-center font-black text-xs"
                                value={customDays[o.user_id] || ""}
                                onChange={(e) => setCustomDays(prev => ({ ...prev, [o.user_id]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="primary"
                                className="h-9 px-3 text-[10px] font-black uppercase rounded-lg group/btn"
                                onClick={() => handleActivate(o.user_id, parseInt(customDays[o.user_id] || "0"))}
                                disabled={activateSubscription.isPending || !customDays[o.user_id]}
                              >
                                {lang === "ar" ? "تفعيل" : "Add"}
                                <Sparkles className="ms-1.5 h-3 w-3 group-hover/btn:rotate-12 transition-transform" />
                              </Button>
                            </div>

                            {/* Preset Buttons */}
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 rounded-xl text-[10px] font-black uppercase gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 transition-all"
                                onClick={() => handleActivate(o.user_id, 30)}
                                disabled={activateSubscription.isPending}
                              >
                                <Play className="h-3 w-3" />
                                {lang === "ar" ? "+ شهر" : "+ 1 Mo"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-10 rounded-xl text-[10px] font-black uppercase gap-1.5 border-primary/30 text-primary hover:bg-primary/5 transition-all"
                                onClick={() => handleActivate(o.user_id, 365)}
                                disabled={activateSubscription.isPending}
                              >
                                {lang === "ar" ? "+ سنة" : "+ 1 Yr"}
                              </Button>
                            </div>
                            
                            {/* Contextual Actions */}
                            <div className="flex items-center gap-1 border-s border-border/30 ps-2 ms-1">
                              {canResume && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  title={lang === "ar" ? "مواصلة الاشتراك" : "Resume subscription"}
                                  className="h-10 w-10 sm:w-auto sm:px-4 rounded-xl text-[10px] font-black uppercase gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-50 transition-all"
                                  onClick={() => handleResume(o.user_id)}
                                  disabled={resumeSubscription.isPending}
                                >
                                  <RotateCcw className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">{lang === "ar" ? "مواصلة" : "Resume"}</span>
                                </Button>
                              )}

                              {o.subscription_status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-10 px-4 rounded-xl text-[10px] font-black uppercase gap-2 border-destructive/20 text-destructive hover:bg-destructive/10 transition-all"
                                  onClick={() => handlePause(o.user_id)}
                                  disabled={pauseSubscription.isPending}
                                  title={t("admin.suspend")}
                                >
                                  <Pause className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">{lang === "ar" ? "إيقاف" : "Pause"}</span>
                                </Button>
                              ) : (
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-10 w-10 rounded-xl text-destructive/40 hover:text-destructive hover:bg-destructive/10 transition-all"
                                  onClick={() => handleReset(o.user_id)}
                                  disabled={resetSubscription.isPending}
                                  title={lang === "ar" ? "تصفير الاشتراك" : "Reset subscription"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
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
              <CreditCard className="h-10 w-10" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest opacity-40">{t("common.noData")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
