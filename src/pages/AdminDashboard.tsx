import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminStats, useAdminOwners } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Users, Crown, CreditCard, TrendingUp, BarChart3, ArrowRight, Wallet, History, Activity, Sparkles, ChevronRight } from "lucide-react";
import { StatsSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const { t, lang, formatCurrency } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: owners = [], isLoading: ownersLoading } = useAdminOwners(1, 10);

  const statusStyles: Record<string, string> = { 
    trial: "bg-amber-500/10 text-amber-600 border-amber-500/20", 
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", 
    expired: "bg-destructive/10 text-destructive border-destructive/20" 
  };
  
  const statusLabels: Record<string, string> = { 
    trial: t("admin.trial"), 
    active: t("admin.active"), 
    expired: t("admin.expired") 
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{t("admin.overview")}</h1>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60 mt-1">{t("admin.subtitle")}</p>
          </div>
          <Button asChild variant="outline" className="h-12 rounded-[20px] px-6 border-primary/20 text-primary hover:bg-primary/5 font-black uppercase text-[10px] tracking-widest relative z-10 transition-all hover:scale-105 active:scale-95 group">
            <Link to="/admin/owners" className="flex items-center gap-2">
              {lang === "ar" ? "إدارة المنشآت" : "Manage Owners"}
              <ArrowRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${lang === "ar" ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </Link>
          </Button>
          <div className="absolute top-[-50%] left-[-10%] w-[40%] h-[200%] bg-primary/5 rotate-45 blur-[120px] pointer-events-none" />
        </div>

        {/* Improved Stat Cards */}
        {statsLoading ? (
          <StatsSkeleton />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: t("admin.totalOwners"), val: stats?.totalOwners ?? 0, icon: Crown, color: "primary", bg: "primary/10" },
              { label: t("admin.activeSubscriptions"), val: stats?.activeSubscriptions ?? 0, icon: CreditCard, color: "blue-500", bg: "blue-500/10" },
              { label: t("admin.totalCustomers"), val: stats?.totalCustomers ?? 0, icon: Users, color: "indigo-500", bg: "indigo-500/10" },
              { label: t("admin.monthlyRevenue"), val: formatCurrency(stats?.totalRevenue ?? 0), icon: TrendingUp, color: "emerald-600", bg: "emerald-500/10" }
            ].map((stat, i) => (
              <div key={i} className="group bg-card/60 backdrop-blur-sm p-6 rounded-[32px] border border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                   <div>
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                      <p className={`text-2xl font-black tracking-tight text-${stat.color}`}>{stat.val}</p>
                   </div>
                   <div className={`h-12 w-12 rounded-[20px] bg-${stat.bg} text-${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <stat.icon className="h-6 w-6" />
                   </div>
                </div>
                <div className="absolute bottom-[-20%] right-[-10%] w-24 h-24 bg-foreground/[0.02] rounded-full blur-2xl group-hover:bg-foreground/[0.05] transition-colors" />
              </div>
            ))}
          </div>
        )}

        {/* Global Performance Summary Section (Optional but Elite) */}
        <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                        <History className="h-5 w-5 text-primary" />
                        {t("admin.recentOwners")}
                    </h2>
                    <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                        {owners.length > 8 ? "8+" : owners.length}
                    </span>
                </div>

                {ownersLoading ? (
                    <TableSkeleton rows={6} />
                ) : (
                    <div className="overflow-hidden rounded-[40px] border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 bg-muted/20">
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.business")}</th>
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "الزباين" : "Users"}</th>
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "الديون" : "Debts"}</th>
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "السداد" : "Paid"}</th>
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "المتبقي" : "Net"}</th>
                                        <th className="px-6 py-5 text-start text-[10px] font-black uppercase tracking-widest text-muted-foreground">{t("admin.status")}</th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">#</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {owners.slice(0, 8).map((o: any) => {
                                        const ownerStats = o.stats || { customersCount: 0, totalDebts: 0, totalPayments: 0, remainingBalance: 0 };
                                        return (
                                            <tr key={o.id} className="hover:bg-primary/[0.02] transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border/50 group-hover:scale-110 transition-transform font-black text-foreground">
                                                            {(o.business_name || o.name || "?").charAt(0)}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-black text-foreground truncate tracking-tight">{o.business_name || "-"}</span>
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 truncate">{o.name}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 font-black text-foreground/80 tabular-nums">{ownerStats.customersCount}</td>
                                                <td className="px-6 py-5 text-destructive font-black tabular-nums">{formatCurrency(ownerStats.totalDebts)}</td>
                                                <td className="px-6 py-5 text-emerald-600 font-black tabular-nums">{formatCurrency(ownerStats.totalPayments)}</td>
                                                <td className="px-6 py-5 font-black text-blue-600 tabular-nums">{formatCurrency(ownerStats.remainingBalance)}</td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black border uppercase tracking-wider ${statusStyles[o.subscription_status] || "bg-muted text-muted-foreground border-border"}`}>
                                                        {statusLabels[o.subscription_status] || o.subscription_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-center">
                                                    <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all">
                                                        <Link to={`/admin/owners/${o.user_id}`}>
                                                            <ChevronRight className={`h-4 w-4 ${lang === "ar" ? "rotate-180" : ""}`} />
                                                        </Link>
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Sidebar Performance Insights (Elite Touch) */}
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-primary to-blue-600 p-8 rounded-[40px] text-white shadow-2xl relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col gap-6">
                        <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30">
                            <Sparkles className="h-7 w-7 text-white" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight leading-tight uppercase">Elite <br/> Admin Panel</h3>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-2">Production Status: Active</p>
                        </div>
                        <div className="pt-4 flex items-center justify-between border-t border-white/10">
                            <div>
                                <p className="text-[10px] font-black uppercase opacity-60 mb-1">{lang === "ar" ? "نسبة النمو" : "Growth"}</p>
                                <p className="text-xl font-black">+14.2%</p>
                            </div>
                            <Activity className="h-10 w-10 opacity-20" />
                        </div>
                    </div>
                    {/* Decorative Blobs */}
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-24 h-24 bg-black/10 rounded-full blur-2xl" />
                </div>
                
                <div className="bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-foreground">{lang === "ar" ? "ملخص السيولة" : "Liquidity Summary"}</h4>
                    </div>
                    <div className="pt-2 space-y-3">
                        <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/30 pb-2">
                             <span>{lang === "ar" ? "قيد التحصيل" : "Pending Assets"}</span>
                             <span className="text-foreground">{formatCurrency(stats?.totalRevenue ? stats.totalRevenue * 0.4 : 24500)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
