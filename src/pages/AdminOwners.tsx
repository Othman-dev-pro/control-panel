import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminOwners, useSuspendOwner, useExportOwnerData } from "@/hooks/useAdminData";
import { exportOwnerDataToExcel, exportOwnerDataToCSV } from "@/utils/exportUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, 
  Crown, 
  TrendingDown, 
  Wallet,
  Settings2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Search,
  ArrowRight,
  BarChart3,
  Building2,
  Activity,
  FileSpreadsheet,
  FileCode,
  Loader2
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";
import { OwnerCardSkeleton } from "@/components/SkeletonLoader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function AdminOwners() {
  const { t, lang, formatCurrency } = useLanguage();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const pageSize = 12;
  
  const { data: owners = [], isLoading } = useAdminOwners(page, pageSize);
  const suspendOwner = useSuspendOwner();
  const exportData = useExportOwnerData();
  const { toast } = useToast();

  const handleExport = async (ownerId: string, businessName: string, format: 'excel' | 'csv') => {
    try {
      toast({ title: lang === "ar" ? "جاري تحضير النسخة الاحتياطية..." : "Preparing backup...", description: lang === "ar" ? "يرجى الانتظار قليلاً" : "Please wait..." });
      const data = await exportData.mutateAsync({ ownerId, businessName });
      
      if (format === 'excel') {
        exportOwnerDataToExcel(data, businessName);
      } else {
        exportOwnerDataToCSV(data, businessName);
      }

      toast({ title: t("common.success"), description: lang === "ar" ? "تم تحميل الملف بنجاح" : "File downloaded successfully" });
    } catch (err) {
      console.error("Export error:", err);
      toast({ variant: "destructive", title: t("common.error"), description: lang === "ar" ? "فشل استخراج البيانات" : "Failed to export data" });
    }
  };

  const handleToggleSuspension = async (userId: string, isSuspended: boolean) => {
    try {
      await suspendOwner.mutateAsync({ userId, suspend: !isSuspended });
      toast({ 
        title: t("common.success"), 
        description: !isSuspended ? (lang === "ar" ? "تم إيقاف المنشأة بنجاح" : "Business suspended") : (lang === "ar" ? "تم تفعيل المنشأة بنجاح" : "Business activated") 
      });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const statusStyles: Record<string, string> = { 
    trial: "bg-amber-500/10 text-amber-600 border-amber-500/20", 
    active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", 
    expired: "bg-destructive/10 text-destructive border-destructive/20" 
  };

  const filteredOwners = useMemo(() => {
    if (!search) return owners;
    const s = search.toLowerCase();
    return owners.filter(o => 
      (o.business_name || "").toLowerCase().includes(s) || 
      (o.name || "").toLowerCase().includes(s) || 
      (o.phone || "").includes(s)
    );
  }, [owners, search]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-inner">
              <Crown className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">
                {t("admin.ownersTitle")}
              </h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">
                {t("admin.ownersSubtitle")}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10">
            <div className="relative group w-full sm:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder={t("admin.searchOwners")} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="h-12 ps-11 rounded-2xl border-border/50 bg-white/50 focus:ring-primary/20 transition-all font-medium text-sm"
              />
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {isLoading ? (
          <OwnerCardSkeleton />
        ) : filteredOwners.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {filteredOwners.map((o: any) => (
              <div 
                key={o.id} 
                className={`group relative flex flex-col rounded-[32px] border transition-all duration-500 overflow-hidden bg-card/60 backdrop-blur-sm p-7 shadow-sm hover:shadow-2xl hover:translate-y-[-4px] ${
                  o.is_suspended ? 'opacity-80 grayscale-[0.4] border-destructive/20' : 'border-border/50 hover:border-primary/30'
                }`}
              >
                {/* Header: Business Identity */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-white flex items-center justify-center text-xl font-black ring-1 ring-border/50 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                      {(o.business_name || o.name || "?").charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-foreground tracking-tight line-clamp-1">{o.business_name || "-"}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[11px] font-bold text-muted-foreground uppercase opacity-70 tracking-wide">{o.name}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted/50 text-muted-foreground/40 hover:text-foreground transition-all">
                        <Settings2 className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 rounded-[24px] border-border bg-card/95 backdrop-blur-md p-2 shadow-2xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-2 opacity-50">
                        {lang === "ar" ? "خيارات متقدمة" : "Advanced Controls"}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-border/30" />
                      
                      <DropdownMenuItem className="rounded-xl px-4 py-2.5 cursor-pointer focus:bg-primary/5 focus:text-primary transition-colors font-bold text-xs" asChild>
                        <Link to={`/admin/owners/${o.user_id}`}>
                          <BarChart3 className="h-4 w-4 me-2" />
                          <span>{lang === "ar" ? "التقارير العميقة" : "Deep Analytics"}</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-border/10" />

                      <DropdownMenuItem 
                        disabled={exportData.isPending}
                        onClick={() => handleExport(o.user_id, o.business_name || o.name, 'excel')}
                        className="rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-50 focus:text-emerald-600 transition-colors font-bold text-xs"
                      >
                        <FileSpreadsheet className="h-4 w-4 me-2" />
                        <span>{lang === "ar" ? "تصدير نسخة إكسل (Excel)" : "Export to Excel"}</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem 
                        disabled={exportData.isPending}
                        onClick={() => handleExport(o.user_id, o.business_name || o.name, 'csv')}
                        className="rounded-xl px-4 py-2.5 cursor-pointer focus:bg-blue-50 focus:text-blue-600 transition-colors font-bold text-xs"
                      >
                        <FileCode className="h-4 w-4 me-2" />
                        <span>{lang === "ar" ? "تصدير نسخة CSV" : "Export to CSV"}</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-border/10" />

                      <DropdownMenuItem 
                        onClick={() => handleToggleSuspension(o.user_id, o.is_suspended)}
                        className={`rounded-xl px-4 py-2.5 cursor-pointer transition-colors font-bold text-xs ${
                          o.is_suspended ? 'text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50' : 'text-destructive focus:text-destructive focus:bg-destructive/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {o.is_suspended ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                          <span>{o.is_suspended ? (lang === "ar" ? "إعادة تفعيل" : "Re-activate") : (lang === "ar" ? "إيقاف مؤقت" : "Suspend Access")}</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Sub-Header: Stats Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-8">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black border uppercase tracking-wider ${
                    o.is_suspended ? 'bg-destructive/10 text-destructive border-destructive/20' : statusStyles[o.subscription_status]
                  }`}>
                    <Activity className="h-3 w-3" />
                    {o.is_suspended ? (lang === "ar" ? "موقوف" : "SUSPENDED") : o.subscription_status}
                  </span>
                  <span className="bg-white/50 border border-border/30 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span dir="ltr">{o.phone}</span>
                  </span>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-border/30 group-hover:ring-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground opacity-60">
                      <Users className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{lang === "ar" ? "زبائن" : "Clints"}</span>
                    </div>
                    <p className="font-black text-xl tracking-tight text-foreground">{o.stats?.customersCount}</p>
                  </div>
                  <div className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-border/30 group-hover:ring-primary/20 transition-all">
                    <div className="flex items-center gap-2 mb-2 text-muted-foreground opacity-60">
                      <Wallet className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-black uppercase tracking-[0.1em]">{lang === "ar" ? "رصيد" : "Balance"}</span>
                    </div>
                    <p className="font-black text-xl tracking-tight text-blue-600">{formatCurrency(o.stats?.remainingBalance)}</p>
                  </div>
                  <div className="rounded-[20px] bg-emerald-500/[0.03] p-4 ring-1 ring-emerald-500/10 col-span-2 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4 text-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "إجمالي الديون" : "Debt Flow"}</span>
                     </div>
                     <span className="font-black text-lg text-emerald-600 uppercase tracking-tighter">{formatCurrency(o.stats?.totalDebts)}</span>
                  </div>
                </div>

                {/* Action CTA Section */}
                <div className="flex gap-3 mt-auto">
                  <Button 
                    variant="outline"
                    onClick={() => handleToggleSuspension(o.user_id, o.is_suspended)}
                    className={`flex-1 h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest transition-all hover:scale-[1.02] active:scale-95 border-2 ${
                      o.is_suspended 
                        ? 'border-emerald-500/20 text-emerald-600 hover:bg-emerald-50' 
                        : 'border-destructive/20 text-destructive hover:bg-destructive/5'
                    }`}
                  >
                    {o.is_suspended ? <ShieldCheck className="h-4 w-4 me-2" /> : <ShieldAlert className="h-4 w-4 me-2" />}
                    {o.is_suspended ? (lang === "ar" ? "تفعيل" : "ACTIVATE") : (lang === "ar" ? "إيقاف" : "STOP")}
                  </Button>

                  <Button asChild className="flex-[1.5] h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-95 group/btn">
                    <Link to={`/admin/owners/${o.user_id}`} className="flex items-center justify-center gap-2">
                      {lang === "ar" ? "إدارة" : "MANAGE"}
                      <ArrowRight className={`h-4 w-4 transition-transform group-hover/btn:translate-x-1 ${lang === "ar" ? "rotate-180 group-hover/btn:-translate-x-1" : ""}`} />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-card/20 rounded-[50px] border border-dashed border-border/50 text-muted-foreground group grayscale">
            <div className="h-24 w-24 rounded-full bg-muted/5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center mb-6 ring-2 ring-muted shadow-sm">
              <Building2 className="h-12 w-12 opacity-10" />
            </div>
            <p className="font-black text-md uppercase tracking-[0.3em] opacity-40">{t("common.noData")}</p>
          </div>
        )}

        {/* Pagination Section */}
        {owners.length > 0 && (
          <div className="flex items-center justify-center gap-4 pt-12 pb-20">
            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-2xl border-border/50 bg-white/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-20 shadow-sm" 
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={page === 1}
            >
              <ChevronLeft className={`h-6 w-6 ${lang === "ar" ? "rotate-180" : ""}`} />
            </Button>
            
            <div className="h-12 px-8 flex items-center justify-center rounded-2xl bg-foreground text-background font-black text-xs uppercase tracking-widest shadow-2xl">
              {lang === "ar" ? `الصفحة ${page}` : `PAGE ${page}`}
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-12 w-12 rounded-2xl border-border/50 bg-white/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-20 shadow-sm" 
              onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              disabled={owners.length < pageSize}
            >
              <ChevronRight className={`h-6 w-6 ${lang === "ar" ? "rotate-180" : ""}`} />
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
