import { useLanguage } from "@/contexts/LanguageContext";
import { useParams, useNavigate } from "react-router-dom";
import { 
  useOwnerCustomers, 
  useCustomerTransactions, 
  useAdminOwners, 
  useDeleteOwner,
  useOwnerTransactions,
  useExportOwnerData
} from "@/hooks/useAdminData";
import { exportOwnerDataToExcel, exportOwnerDataToCSV } from "@/utils/exportUtils";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Users, 
  Phone, 
  Wallet, 
  TrendingDown, 
  TrendingUp, 
  ChevronRight, 
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Search,
  Filter,
  History,
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  Download,
  Trash2,
  AlertTriangle,
  Clock,
  Calendar,
  FileSpreadsheet,
  FileCode,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsSkeleton, TableSkeleton } from "@/components/SkeletonLoader";
import { useToast } from "@/hooks/use-toast";


export default function AdminOwnerDetails() {
  const { t, lang, formatCurrency } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: owners = [], isLoading: ownersLoading } = useAdminOwners(1, 100); 
  const { data: customers = [], isLoading: customersLoading } = useOwnerCustomers(id || "");
  const { data: allOwnerTransactions = [] } = useOwnerTransactions(id || "");
  const deleteOwner = useDeleteOwner();
  const exportData = useExportOwnerData();
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: transactions = [], isLoading: txLoading } = useCustomerTransactions(selectedCustomerId || "");

  const owner = owners.find(o => o.user_id === id);
  const canDelete = (owner?.stats?.remainingBalance || 0) === 0;
  
  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone || "").includes(search)
  );

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const filteredTransactions = useMemo(() => {
    let result = [...transactions];
    if (typeFilter !== "all") result = result.filter(tx => tx.type === typeFilter);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    if (timeFilter === "today") {
      result = result.filter(tx => new Date(tx.created_at) >= startOfToday);
    } else if (timeFilter === "yesterday") {
      result = result.filter(tx => {
        const d = new Date(tx.created_at);
        return d >= startOfYesterday && d < startOfToday;
      });
    } else if (timeFilter === "month") {
      result = result.filter(tx => new Date(tx.created_at) >= startOfMonth);
    } else if (timeFilter === "custom" && customStart) {
      const start = new Date(customStart);
      const end = customEnd ? new Date(customEnd) : new Date();
      end.setHours(23, 59, 59, 999);
      result = result.filter(tx => {
        const d = new Date(tx.created_at);
        return d >= start && d <= end;
      });
    }
    return result;
  }, [transactions, typeFilter, timeFilter, customStart, customEnd]);

  const handleExport = async (format: 'excel' | 'csv') => {
    if (!owner || !id) {
      console.error("Export Error: Owner or ID is missing", { owner, id });
      return;
    }
    
    try {
      const ownerName = owner.business_name || owner.name || "Business";
      console.log(`Starting ${format} export for:`, ownerName);
      
      toast({ 
        title: lang === "ar" ? "جاري تحضير الملف..." : "Preparing file...",
        description: lang === "ar" ? "يرجى الانتظار" : "Please wait"
      });

      // Pass the prefetchedProfile (owner) to skip the falling database query
      const data = await exportData.mutateAsync({ 
        ownerId: id, 
        businessName: ownerName,
        prefetchedProfile: owner 
      });
      
      if (format === 'excel') {
        exportOwnerDataToExcel(data, ownerName);
      } else {
        exportOwnerDataToCSV(data, ownerName);
      }

      toast({ 
        title: t("common.success"), 
        description: lang === "ar" ? "تم استخراج البيانات بنجاح" : "Data exported successfully" 
      });
    } catch (err) {
      console.error("CRITICAL EXPORT ERROR:", err);
      toast({ 
        variant: "destructive", 
        title: t("common.error"),
        description: lang === "ar" ? "فشل التصدير، يرجى المحاولة لاحقاً" : "Export failed, please try again"
      });
    }
  };

  const handleDeleteBusiness = async () => {
    if (!id || !canDelete) return;
    try {
      await deleteOwner.mutateAsync(id);
      toast({ title: lang === "ar" ? "تم حذف المنشأة نهائياً" : "Business Permanently Deleted" });
      navigate("/admin/owners");
    } catch (err: any) {
      console.error("Owner delete error:", err);
      toast({ 
        variant: "destructive", 
        title: lang === "ar" ? "خطأ في الحذف الجذري" : "Hard Purge Error",
        description: err.message || (lang === "ar" ? "فشل الحذف، يرجى التحقق من السجلات" : "Deletion failed, please check logs")
      });
    }
  };

  if (!owner && !ownersLoading && owners.length > 0) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <LayoutDashboard className="h-16 w-16 text-muted-foreground opacity-10 mb-4" />
          <p className="text-muted-foreground font-black uppercase tracking-widest">{lang === "ar" ? "المنشأة غير موجودة" : "Business not found"}</p>
          <Button variant="link" onClick={() => navigate("/admin/owners")} className="mt-2 text-primary font-bold">
            {lang === "ar" ? "العودة للقائمة" : "Back to list"}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-10 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-6 relative z-10">
            <Button variant="outline" size="icon" onClick={() => navigate("/admin/owners")} className="rounded-[20px] h-12 w-12 border-border/50 hover:bg-primary/5 transition-all">
              <ArrowLeft className={`h-6 w-6 ${lang === "ar" ? "rotate-180" : ""}`} />
            </Button>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground">{owner?.business_name || "..."}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 opacity-60">
                <span className="text-[11px] font-black uppercase tracking-widest bg-muted px-2 py-0.5 rounded-md">{owner?.name}</span>
                <span className="text-[11px] font-black tracking-widest" dir="ltr">{owner?.phone}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 relative z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={exportData.isPending} variant="outline" className="h-12 px-6 rounded-[20px] font-black uppercase text-[10px] tracking-widest border-emerald-500/20 text-emerald-600 bg-emerald-500/5 hover:bg-emerald-500/10 gap-2">
                  {exportData.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {lang === "ar" ? "تصدير البيانات" : "Export Backup"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[24px] border-border bg-card/95 backdrop-blur-md p-2 shadow-2xl">
                <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-2 opacity-50">
                  {lang === "ar" ? "صيغة التصدير" : "Export Format"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-border/30" />
                
                <DropdownMenuItem 
                  onClick={() => handleExport('excel')}
                  className="rounded-xl px-4 py-2.5 cursor-pointer focus:bg-emerald-50 focus:text-emerald-600 transition-colors font-bold text-xs"
                >
                  <FileSpreadsheet className="h-4 w-4 me-2" />
                  <span>{lang === "ar" ? "تصدير نسخة إكسل (Excel)" : "Export to Excel"}</span>
                </DropdownMenuItem>

                <DropdownMenuItem 
                  onClick={() => handleExport('csv')}
                  className="rounded-xl px-4 py-2.5 cursor-pointer focus:bg-blue-50 focus:text-blue-600 transition-colors font-bold text-xs"
                >
                  <FileCode className="h-4 w-4 me-2" />
                  <span>{lang === "ar" ? "تصدير نسخة CSV" : "Export to CSV"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" disabled={!canDelete} className="h-12 px-6 rounded-[20px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-lg shadow-destructive/20 transition-all hover:scale-105 active:scale-95 disabled:grayscale disabled:opacity-30">
                  <Trash2 className="h-4 w-4" />
                  {lang === "ar" ? "حذف الحساب" : "Delete Account"}
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[32px] border-border bg-card/95 backdrop-blur-md max-w-md p-8">
                <DialogHeader>
                  <div className="h-16 w-16 rounded-[24px] bg-destructive/10 text-destructive flex items-center justify-center mb-6 ring-4 ring-destructive/5 animate-pulse">
                    <AlertTriangle className="h-8 w-8" />
                  </div>
                  <DialogTitle className="text-xl font-black tracking-tight text-foreground mb-2">
                    {lang === "ar" ? "تأكيد حذف المنشأة" : "Confirm Deletion"}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground leading-relaxed">
                    {lang === "ar" 
                      ? "هل أنت متأكد من حذف هذه المنشأة؟ سيتم حذف كافة بيانات المنشأة والموظفين. ملاحظة: يجب أن تكون ديون المنشأة عند الزبائن صفر لإتمام الحذف."
                      : "Are you sure? This will permanently delete the business and all linked employees. Deletion is only possible if the balance is zero."}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col sm:flex-row gap-3 mt-8">
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest">
                    {lang === "ar" ? "إلغاء" : "Cancel"}
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteBusiness} disabled={deleteOwner.isPending} className="flex-1 h-12 rounded-[20px] font-black uppercase text-[10px] tracking-widest">
                    {lang === "ar" ? "تأكيد الحذف النهائي" : "Confirm Permanent Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[40%] h-[150%] bg-primary/5 rotate-12 blur-[130px] pointer-events-none" />
        </div>

        {ownersLoading ? <StatsSkeleton /> : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: lang === "ar" ? "إجمالي الزبائن" : "Total Customers", val: owner?.stats?.customersCount || 0, icon: Users, color: "primary", bg: "primary/10" },
              { label: lang === "ar" ? "إجمالي الديون" : "Total Debts", val: formatCurrency(owner?.stats?.totalDebts || 0), icon: TrendingDown, color: "destructive", bg: "destructive/10" },
              { label: lang === "ar" ? "إجمالي السداد" : "Total Payments", val: formatCurrency(owner?.stats?.totalPayments || 0), icon: TrendingUp, color: "emerald-600", bg: "emerald-500/10" },
              { label: lang === "ar" ? "المتبقي للمنشأة" : "Remaining Assets", val: formatCurrency(owner?.stats?.remainingBalance || 0), icon: Wallet, color: "blue-600", bg: "blue-500/10" }
            ].map((stat, i) => (
              <div key={i} className="bg-card/60 backdrop-blur-sm p-6 rounded-[32px] border border-border/50 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all duration-500">
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest opacity-60 mb-1">{stat.label}</p>
                    <p className={`text-2xl font-black tracking-tight text-${stat.color}`}>{stat.val}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-[20px] bg-${stat.bg} text-${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-12">
          {/* Customers Navigation Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {lang === "ar" ? "قائمة الزبائن" : "Clints Directory"}
              </h2>
              <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                {customers.length}
              </span>
            </div>
            
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder={lang === "ar" ? "إبحث في الزبائن..." : "Search clints..."} 
                value={search} 
                onChange={(e) => setSearch(e.target.value)} 
                className="h-12 ps-12 rounded-[20px] border-border/50 bg-card/60 backdrop-blur-md focus:ring-primary/20 text-sm font-bold"
              />
            </div>

            <div className="space-y-3 max-h-[700px] overflow-y-auto custom-scrollbar pr-2 pb-10">
              {customersLoading ? Array(7).fill(0).map((_, i) => (
                <div key={i} className="h-[80px] rounded-[24px] bg-muted/20 animate-pulse" />
              )) : filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCustomerId(c.id)}
                  className={`w-full text-start p-5 rounded-[24px] border transition-all duration-400 relative group flex items-center justify-between overflow-hidden ${
                    selectedCustomerId === c.id 
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/5 ring-1 ring-primary/20" 
                      : "border-border/40 bg-card/40 hover:border-primary/30 hover:bg-card/70"
                  }`}
                >
                  <div className="min-w-0 relative z-10">
                    <p className={`font-black text-sm truncate transition-colors ${selectedCustomerId === c.id ? 'text-primary' : 'text-foreground'}`}>{c.name}</p>
                    <div className="flex flex-col gap-1.5 mt-2">
                       <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1.5 opacity-60">
                          <Phone className="h-3 w-3" /> <span dir="ltr">{c.phone}</span>
                       </p>
                       {c.firstTransactionDate && (
                         <p className="text-[9px] font-black text-primary/60 flex items-center gap-1.5 bg-primary/5 w-fit px-2 py-0.5 rounded-full uppercase tracking-wider">
                           <Clock className="h-2.5 w-2.5" /> {lang === "ar" ? "أول حركة:" : "Since:"} {new Date(c.firstTransactionDate).toLocaleDateString()}
                         </p>
                       )}
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${selectedCustomerId === c.id ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-muted/40 text-muted-foreground group-hover:bg-primary/10'}`}>
                    <ChevronRight className={`h-5 w-5 ${lang === "ar" ? "rotate-180" : ""}`} />
                  </div>
                </button>
              )) : (
                <div className="py-24 text-center rounded-[32px] border border-dashed border-border/50 opacity-40">
                   <Users className="h-10 w-10 mx-auto mb-2 opacity-10" />
                   <p className="text-xs font-black uppercase tracking-widest">{lang === "ar" ? "لا يوجد بيانات" : "No Records"}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Ledger Main Section */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h2 className="text-lg font-black text-foreground uppercase tracking-tight flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {selectedCustomer ? (lang === "ar" ? `سجل: ${selectedCustomer.name}` : `Records: ${selectedCustomer.name}`) : (lang === "ar" ? "العمليات المالية" : "Financial Records")}
              </h2>
              {selectedCustomer?.debt_limit && (
                <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-600 px-4 py-2 rounded-2xl border border-amber-500/20 shadow-sm animate-in zoom-in-95">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.1em]">{lang === "ar" ? "سقف الدين: " : "DEBT LIMIT: "} {formatCurrency(selectedCustomer.debt_limit)}</span>
                </div>
              )}
            </div>

            {selectedCustomerId && (
              <div className="flex flex-wrap items-center gap-4 bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm animate-in slide-in-from-top-3">
                <div className="flex items-center gap-2 pe-4 border-e border-border/50">
                  <Filter className="h-4 w-4 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "فرز:" : "Sort:"}</span>
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-none text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-card/95 backdrop-blur-md">
                    <SelectItem value="all">{lang === "ar" ? "الكل" : "All"}</SelectItem>
                    <SelectItem value="debt" className="text-destructive font-black">{lang === "ar" ? "الديون" : "Debts"}</SelectItem>
                    <SelectItem value="payment" className="text-emerald-600 font-black">{lang === "ar" ? "السداد" : "Payments"}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-none text-[10px] font-black uppercase tracking-widest focus:ring-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border">
                    <SelectItem value="all">{lang === "ar" ? "كل الوقت" : "All Time"}</SelectItem>
                    <SelectItem value="today">{lang === "ar" ? "اليوم" : "Today"}</SelectItem>
                    <SelectItem value="yesterday">{lang === "ar" ? "أمس" : "Yesterday"}</SelectItem>
                    <SelectItem value="month">{lang === "ar" ? "هذا الشهر" : "This Month"}</SelectItem>
                    <SelectItem value="custom">{lang === "ar" ? "مخصص" : "Custom"}</SelectItem>
                  </SelectContent>
                </Select>

                {timeFilter === "custom" && (
                  <div className="flex items-center gap-2 animate-in zoom-in-95">
                    <Input type="date" className="h-10 text-[10px] w-[140px] rounded-xl bg-card border-none font-bold" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                    <span className="text-muted-foreground opacity-30 px-1 font-black">→</span>
                    <Input type="date" className="h-10 text-[10px] w-[140px] rounded-xl bg-card border-none font-bold" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                  </div>
                )}
              </div>
            )}

            {!selectedCustomerId ? (
              <div className="rounded-[40px] border border-dashed border-border/50 bg-card/20 py-48 text-center px-12 group grayscale-0">
                <div className="h-24 w-24 rounded-full bg-muted/10 mx-auto flex items-center justify-center mb-8 ring-4 ring-muted group-hover:scale-110 transition-transform duration-500 shadow-inner">
                   <Users className="h-10 w-10 text-muted-foreground opacity-20" />
                </div>
                <h3 className="text-xl font-black tracking-tight text-foreground mb-4 uppercase">{lang === "ar" ? "بانتظار تحديد الزبون" : "Select a Clit First"}</h3>
                <p className="max-w-md mx-auto text-sm font-medium text-muted-foreground leading-relaxed">
                  {lang === "ar" ? "اختر أحد الزبائن لعرض تفاصيل الديون والسداد ومرفقات كل عملية بشكل مفصل وتقريري." : "Please choose a client from the directory to unlock high-fidelity transaction analytics and proof logs."}
                </p>
              </div>
            ) : txLoading ? (
              <TableSkeleton rows={8} />
            ) : (
              <div className="space-y-6 animate-in fade-in duration-700">
                {filteredTransactions.length > 0 ? (
                  <div className="overflow-hidden rounded-[32px] border border-border/50 bg-card/60 backdrop-blur-md shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-start">
                        <thead>
                          <tr className="border-b border-border/50 bg-muted/30">
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "المبلغ" : "Amount"}</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "تاريخ / وقت" : "Time Log"}</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "التفاصيل" : "Specs"}</th>
                            <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">{lang === "ar" ? "مرفق" : "File"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                          {filteredTransactions.map((tx: any) => (
                            <tr key={tx.id} className="hover:bg-primary/[0.03] transition-colors group">
                              <td className="px-6 py-5">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-tighter border ${
                                  tx.type === "debt" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                }`}>
                                  {tx.type === "debt" ? (lang === "ar" ? "دين" : "DEBT") : (lang === "ar" ? "سداد" : "PAID")}
                                </span>
                              </td>
                              <td className={`px-6 py-5 font-black text-base tracking-tight tabular-nums ${tx.type === "debt" ? "text-destructive" : "text-emerald-600"}`}>
                                {tx.type === "debt" ? "-" : "+"}{formatCurrency(tx.amount)}
                              </td>
                              <td className="px-6 py-5 whitespace-nowrap">
                                <div className="flex flex-col">
                                   <span className="font-bold text-foreground/80 tracking-tight flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 opacity-40" />
                                      {new Date(tx.created_at).toLocaleDateString()}
                                   </span>
                                   <span className="text-[10px] font-black text-muted-foreground opacity-50 tracking-widest mt-1 flex items-center gap-1.5 ps-1">
                                      <Clock className="h-2.5 w-2.5" />
                                      {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                   </span>
                                </div>
                              </td>
                              <td className="px-6 py-5 max-w-[220px] truncate italic font-medium text-muted-foreground text-xs" title={tx.description || ""}>
                                {tx.description || "—"}
                              </td>
                              <td className="px-6 py-5 text-center">
                                {tx.image_url ? (
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-primary/5 text-primary hover:bg-primary/20 hover:scale-110 transition-all">
                                        <ImageIcon className="h-4 w-4" />
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-3xl border-none bg-transparent shadow-none p-0 overflow-hidden rounded-[40px]">
                                      <div className="relative group animate-in zoom-in-95 duration-500">
                                        <img src={tx.image_url} alt="Proof" className="w-full h-auto rounded-[40px] shadow-2xl ring-1 ring-white/20" />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm rounded-[40px]">
                                          <a href={tx.image_url} target="_blank" rel="noreferrer" className="bg-white text-black font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition-all flex items-center gap-2">
                                            <ExternalLink className="h-4 w-4" />
                                            {lang === "ar" ? "فتح المصدر للتحميل" : "Unlock Full Media"}
                                          </a>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                ) : <span className="opacity-10">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center rounded-[32px] border border-dashed border-border/50 bg-muted/5">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground opacity-10 mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">{lang === "ar" ? "لا نتائج للبحث" : "Logs Empty for this range"}</p>
                    <Button variant="link" size="sm" className="mt-4 font-black uppercase text-[9px] text-primary" onClick={() => { setTypeFilter("all"); setTimeFilter("all"); }}>
                      {lang === "ar" ? "تصفير الفلتر" : "Reset Data Scope"}
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
