import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminOwners, useSuspendOwner } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Crown, Phone, Calendar, Ban, CheckCircle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AdminOwners() {
  const { t, lang } = useLanguage();
  const { data: owners = [], isLoading } = useAdminOwners();
  const suspendOwner = useSuspendOwner();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const statusStyles: Record<string, string> = { trial: "status-trial", active: "status-active", expired: "status-expired" };
  const statusLabels: Record<string, string> = { trial: t("admin.trial"), active: t("admin.active"), expired: t("admin.expired") };

  const filtered = owners.filter(
    (o: any) =>
      (o.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.business_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.phone || "").includes(search)
  );

  const handleSuspend = async (userId: string, suspend: boolean) => {
    try {
      await suspendOwner.mutateAsync({ userId, suspend });
      toast({
        title: t("common.success"),
        description: suspend
          ? (lang === "ar" ? "تم إيقاف المنشأة" : "Business suspended")
          : (lang === "ar" ? "تم تفعيل المنشأة" : "Business activated"),
      });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("nav.owners")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.ownersSubtitle")}</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground start-3" />
          <Input placeholder={t("admin.searchOwners")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-10" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filtered.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((o: any) => {
              const endDate = o.subscription_ends_at || o.trial_ends_at;
              const isSuspended = o.is_suspended;
              return (
                <div key={o.id} className={`rounded-xl border bg-card p-5 space-y-3 animate-fade-in ${isSuspended ? "border-destructive/30 opacity-75" : "border-border"}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold">
                      {(o.business_name || o.name || "?").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-card-foreground truncate">{o.business_name || o.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{o.name}</p>
                    </div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${isSuspended ? "bg-destructive/10 text-destructive" : statusStyles[o.subscription_status] || "status-trial"}`}>
                      {isSuspended ? (lang === "ar" ? "موقوف" : "Suspended") : statusLabels[o.subscription_status] || o.subscription_status}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" /> <span dir="ltr">{o.phone || "-"}</span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {endDate ? new Date(endDate).toLocaleDateString() : "-"}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSuspend(o.user_id, !isSuspended)}
                    disabled={suspendOwner.isPending}
                    className={`w-full rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                      isSuspended
                        ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm"
                        : "bg-destructive/10 text-destructive hover:bg-destructive/20"
                    }`}
                  >
                    {isSuspended ? (
                      <><CheckCircle className="h-4 w-4" /> {lang === "ar" ? "تفعيل المنشأة" : "Activate Business"}</>
                    ) : (
                      <><Ban className="h-4 w-4" /> {lang === "ar" ? "إيقاف المنشأة" : "Suspend Business"}</>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Crown className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">{t("common.noData")}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
