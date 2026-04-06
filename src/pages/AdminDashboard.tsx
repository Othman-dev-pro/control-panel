import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminStats, useAdminOwners, useActivateSubscription } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Users, Crown, CreditCard, TrendingUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const { t, formatCurrency } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: owners = [], isLoading: ownersLoading } = useAdminOwners();
  const activateSubscription = useActivateSubscription();
  const { toast } = useToast();

  const statusStyles: Record<string, string> = { trial: "status-trial", active: "status-active", expired: "status-expired" };
  const statusLabels: Record<string, string> = { trial: t("admin.trial"), active: t("admin.active"), expired: t("admin.expired") };

  const handleActivate = async (userId: string) => {
    try {
      await activateSubscription.mutateAsync({ userId, days: 30 });
      toast({ title: t("common.success"), description: t("admin.activated") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const isLoading = statsLoading || ownersLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.overview")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.subtitle")}</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard title={t("admin.totalOwners")} value={stats?.totalOwners ?? 0} icon={Crown} />
              <StatCard title={t("admin.activeSubscriptions")} value={stats?.activeSubscriptions ?? 0} icon={CreditCard} iconClassName="bg-accent/10 text-accent" />
              <StatCard title={t("admin.totalCustomers")} value={stats?.totalCustomers ?? 0} icon={Users} iconClassName="bg-secondary/10 text-secondary" />
              <StatCard title={t("admin.monthlyRevenue")} value={formatCurrency(stats?.totalRevenue ?? 0)} icon={TrendingUp} iconClassName="bg-accent/10 text-accent" />
            </div>

            <div className="rounded-xl border border-border bg-card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="font-semibold text-card-foreground">{t("admin.recentOwners")}</h2>
              </div>
              {owners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="px-5 py-3 text-start font-semibold text-muted-foreground">{t("admin.business")}</th>
                        <th className="px-5 py-3 text-start font-semibold text-muted-foreground">{t("admin.owner")}</th>
                        <th className="px-5 py-3 text-start font-semibold text-muted-foreground">{t("admin.phone")}</th>
                        <th className="px-5 py-3 text-start font-semibold text-muted-foreground">{t("admin.subscriptionDate")}</th>
                        <th className="px-5 py-3 text-start font-semibold text-muted-foreground">{t("admin.status")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {owners.map((o: any) => {
                        const endDate = o.subscription_ends_at || o.trial_ends_at;
                        return (
                          <tr key={o.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-card-foreground">{o.business_name || "-"}</td>
                            <td className="px-5 py-3.5 text-muted-foreground">{o.name}</td>
                            <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground" dir="ltr">{o.phone || "-"}</td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground">
                              {endDate ? new Date(endDate).toLocaleDateString() : "-"}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusStyles[o.subscription_status] || "status-trial"}`}>
                                {statusLabels[o.subscription_status] || o.subscription_status}
                              </span>
                            </td>
                            </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-sm text-muted-foreground">{t("common.noData")}</div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
