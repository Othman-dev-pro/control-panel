import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminPlans, useCreatePlan, useUpdatePlan, useDeletePlan } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Check, Plus, Pencil, Trash2, Loader2, X, FileText } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("admin.plansTitle")}</h1>
            <p className="text-sm text-muted-foreground">{lang === "ar" ? "إضافة وتعديل وحذف خطط الاشتراك" : "Add, edit & delete subscription plans"}</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {lang === "ar" ? "إضافة خطة" : "Add Plan"}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : plans.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan: any) => (
              <div key={plan.id} className={`relative rounded-xl border bg-card p-6 ${plan.is_popular ? "border-primary ring-1 ring-primary" : "border-border"}`}>
                {plan.is_popular && (
                  <span className="absolute -top-2.5 start-4 rounded-full bg-primary px-3 py-0.5 text-[11px] font-semibold text-primary-foreground">
                    {t("sub.mostPopular")}
                  </span>
                )}
                <h3 className="text-lg font-bold text-card-foreground">{lang === "ar" ? plan.name_ar : plan.name_en}</h3>
                <p className="mt-2 text-3xl font-extrabold text-primary">${plan.price}</p>
                <p className="text-sm text-muted-foreground">{plan.duration_days} {t("sub.days")}</p>
                <ul className="mt-5 space-y-2.5">
                  {(lang === "ar" ? plan.features_ar : plan.features_en || []).map((f: string, i: number) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3 w-3" /> {t("common.edit")}
                  </Button>
                  <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleDelete(plan.id)} disabled={deletePlan.isPending}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="mb-3 h-12 w-12 opacity-30" />
            <p className="font-medium">{t("common.noData")}</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? (lang === "ar" ? "تعديل الخطة" : "Edit Plan") : (lang === "ar" ? "إضافة خطة جديدة" : "New Plan")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">{lang === "ar" ? "الاسم (عربي)" : "Name (Arabic)"}</label>
                <Input value={form.name_ar} onChange={e => setForm(f => ({ ...f, name_ar: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">{lang === "ar" ? "الاسم (إنجليزي)" : "Name (English)"}</label>
                <Input value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "السعر ($)" : "Price ($)"}</label>
              <Input
                type="number"
                min={0}
                inputMode="numeric"
                value={form.price || ""}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) || 0 }))}
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "المدة (أيام)" : "Duration (days)"}</label>
              <div className="flex gap-2 mb-2">
                {[
                  { label: lang === "ar" ? "شهر" : "1 Month", days: 30 },
                  { label: lang === "ar" ? "3 أشهر" : "3 Months", days: 90 },
                  { label: lang === "ar" ? "سنة" : "1 Year", days: 365 },
                ].map(preset => (
                  <button
                    key={preset.days}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, duration_days: preset.days }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.duration_days === preset.days
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                inputMode="numeric"
                value={form.duration_days || ""}
                onChange={e => setForm(f => ({ ...f, duration_days: Number(e.target.value) || 0 }))}
                placeholder={lang === "ar" ? "أو أدخل عدد الأيام" : "Or enter days"}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "المميزات (عربي) - سطر لكل ميزة" : "Features (Arabic) - one per line"}</label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.features_ar} onChange={e => setForm(f => ({ ...f, features_ar: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{lang === "ar" ? "المميزات (إنجليزي) - سطر لكل ميزة" : "Features (English) - one per line"}</label>
              <textarea className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[80px]" value={form.features_en} onChange={e => setForm(f => ({ ...f, features_en: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_popular} onCheckedChange={v => setForm(f => ({ ...f, is_popular: v }))} />
              <label className="text-sm font-medium text-foreground">{t("sub.mostPopular")}</label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button className="flex-1" onClick={handleSave} disabled={createPlan.isPending || updatePlan.isPending}>
                {t("common.save")}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
