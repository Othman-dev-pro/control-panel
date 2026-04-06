import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, Plus, Pencil, Trash2, X, FileText, Sparkles, LayoutGrid, Package } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PlanCardSkeleton } from "@/components/SkeletonLoader";

interface PlanForm {
  name_ar: string; name_en: string; price: number; duration_days: number;
  features_ar: string; features_en: string; is_popular: boolean;
}

const emptyForm: PlanForm = { name_ar: "", name_en: "", price: 0, duration_days: 30, features_ar: "", features_en: "", is_popular: false };

export default function AdminPlans() {
  const { t, lang, formatCurrency } = useLanguage();
  const { data: plans = [], isLoading } = useAdminPlans();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();
  const deletePlan = useDeletePlan();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PlanForm>(emptyForm);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (p: any) => {
    setEditingId(p.id);
    setForm({
      name_ar: p.name_ar, name_en: p.name_en, price: p.price, duration_days: p.duration_days,
      features_ar: (p.features_ar || []).join("\n"), features_en: (p.features_en || []).join("\n"),
      is_popular: p.is_popular,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      name_ar: form.name_ar, name_en: form.name_en, price: form.price, duration_days: form.duration_days,
      features_ar: form.features_ar.split("\n").filter(Boolean),
      features_en: form.features_en.split("\n").filter(Boolean),
      is_popular: form.is_popular,
    };
    try {
      if (editingId) {
        await updatePlan.mutateAsync({ id: editingId, ...payload });
      } else {
        await createPlan.mutateAsync(payload);
      }
      toast({ title: t("common.success") });
      setDialogOpen(false);
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePlan.mutateAsync(id);
      toast({ title: t("common.success"), description: lang === "ar" ? "تم حذف الخطة" : "Plan deleted" });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in duration-700">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-md p-6 rounded-[32px] border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-sm">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">{t("admin.plansTitle")}</h1>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-60">
                {lang === "ar" ? "إدارة عروض الاشتراك والأسعار" : "Manage subscription offers & pricing"}
              </p>
            </div>
          </div>
          <Button onClick={openCreate} className="h-11 rounded-2xl gap-2 px-6 shadow-lg shadow-primary/20 group">
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-bold">{lang === "ar" ? "إضافة خطة جديدة" : "Create New Plan"}</span>
          </Button>
        </div>

        {isLoading ? (
          <PlanCardSkeleton />
        ) : plans.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <div 
                key={plan.id} 
                className={`group relative rounded-[32px] border transition-all duration-500 overflow-hidden bg-card/60 backdrop-blur-sm p-8 flex flex-col shadow-sm hover:shadow-xl hover:translate-y-[-4px] ${
                  plan.is_popular 
                    ? "border-primary ring-1 ring-primary/30 bg-primary/5" 
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                {plan.is_popular && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest py-1.5 px-6 rounded-bl-2xl shadow-sm flex items-center gap-1.5">
                      <Sparkles className="h-3 w-3" />
                      {t("sub.mostPopular")}
                    </div>
                  </div>
                )}
                
                <div className="space-y-4 mb-8">
                  <h3 className="text-xl font-black tracking-tight text-foreground transition-colors group-hover:text-primary">
                    {lang === "ar" ? plan.name_ar : plan.name_en}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black tracking-tighter text-foreground">{formatCurrency(plan.price)}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest opacity-60">/ {plan.duration_days} {t("sub.days")}</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{lang === "ar" ? "المميزات" : "Features"}</p>
                  <ul className="space-y-3.5">
                    {(lang === "ar" ? plan.features_ar : plan.features_en || []).map((f: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 group/item">
                        <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 group-hover/item:scale-110 transition-transform">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground/90 leading-tight">{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 flex gap-3 pt-6 border-t border-dashed border-border/50">
                  <Button 
                    variant="outline" 
                    size="default" 
                    className="flex-1 h-11 rounded-2xl gap-2 border-border/50 bg-white hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-all font-bold shadow-sm"
                    onClick={() => openEdit(plan)}
                  >
                    <Pencil className="h-4 w-4" /> 
                    {t("common.edit")}
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-11 w-11 rounded-2xl text-destructive hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-all font-bold"
                    onClick={() => handleDelete(plan.id)}
                    disabled={deletePlan.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-card/30 rounded-[40px] border border-dashed border-border/50 text-muted-foreground group">
            <div className="h-20 w-20 rounded-full bg-muted/5 group-hover:scale-110 transition-transform duration-500 flex items-center justify-center mb-4">
              <FileText className="h-10 w-10 opacity-10" />
            </div>
            <p className="font-black text-sm uppercase tracking-widest opacity-40">{t("common.noData")}</p>
            <Button variant="link" onClick={openCreate} className="mt-2 font-bold text-primary">
              {lang === "ar" ? "أضف أول خطة الآن" : "Add your first plan now"}
            </Button>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
          <DialogHeader className="bg-primary p-8 text-white relative h-24 flex items-center justify-center">
            <DialogTitle className="text-2xl font-black tracking-tight mt-0">
              {editingId ? (lang === "ar" ? "تعديل الخطة" : "Edit Plan") : (lang === "ar" ? "إضافة خطة جديدة" : "New Plan")}
            </DialogTitle>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-12 w-12 rounded-2xl bg-white text-primary flex items-center justify-center shadow-lg">
              <Package className="h-6 w-6" />
            </div>
          </DialogHeader>
          <div className="p-8 pt-10 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "الاسم (عربي)" : "Name (AR)"}</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20" value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "الاسم (إنجليزي)" : "Name (EN)"}</label>
                <Input className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "السعر" : "Price"}</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
                  <Input
                    type="number"
                    min={0}
                    className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20 pl-8"
                    value={form.price || ""}
                    onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "المدة (أيام)" : "Duration (Days)"}</label>
                <Input
                  type="number"
                  min={1}
                  className="h-12 rounded-2xl border-border/50 bg-muted/20 focus:ring-primary/20"
                  value={form.duration_days || ""}
                  onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "المميزات (عربي) - سطر لكل ميزة" : "Features (AR) - one per line"}</label>
              <textarea 
                className="w-full rounded-[20px] border border-border/50 bg-muted/20 px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all" 
                value={form.features_ar} 
                onChange={e => setForm(f => ({ ...f, features_ar: e.target.value }))} 
                placeholder={lang === "ar" ? "أدخل كل ميزة في سطر منفصل..." : "Enter each feature in a new line..."}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ps-1">{lang === "ar" ? "المميزات (إنجليزي) - سطر لكل ميزة" : "Features (EN) - one per line"}</label>
              <textarea 
                className="w-full rounded-[20px] border border-border/50 bg-muted/20 px-4 py-3 text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-primary/20 transition-all" 
                value={form.features_en} 
                onChange={e => setForm(f => ({ ...f, features_en: e.target.value }))} 
                placeholder="Enter each feature in a new line..."
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="h-4 w-4" />
                </div>
                <label className="text-sm font-bold text-foreground">{t("sub.mostPopular")}</label>
              </div>
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} className="data-[state=checked]:bg-primary" />
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1 h-12 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending}>
                {t("common.save")}
              </Button>
              <Button variant="outline" className="h-12 px-8 rounded-2xl border-border/50 font-bold" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
