import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, Building2, Wallet } from "lucide-react";

interface BankAccount {
  name_ar: string; name_en: string; bank_ar: string; bank_en: string;
  number: string; instructions_ar: string; instructions_en: string;
}

interface WalletAccount {
  name_ar: string; name_en: string; provider_ar: string; provider_en: string;
  phone: string; instructions_ar: string; instructions_en: string;
}

export default function AdminPaymentAccounts() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [wallets, setWallets] = useState<WalletAccount[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      try { setBanks(JSON.parse(settings["payment_bank_accounts"] || "[]")); } catch { setBanks([]); }
      try { setWallets(JSON.parse(settings["payment_wallet_accounts"] || "[]")); } catch { setWallets([]); }
    }
  }, [settings]);

  const addBank = () => setBanks(prev => [...prev, { name_ar: "", name_en: "", bank_ar: "", bank_en: "", number: "", instructions_ar: "", instructions_en: "" }]);
  const removeBank = (i: number) => setBanks(prev => prev.filter((_, idx) => idx !== i));
  const updateBank = (i: number, field: keyof BankAccount, val: string) => setBanks(prev => prev.map((b, idx) => idx === i ? { ...b, [field]: val } : b));

  const addWallet = () => setWallets(prev => [...prev, { name_ar: "", name_en: "", provider_ar: "", provider_en: "", phone: "", instructions_ar: "", instructions_en: "" }]);
  const removeWallet = (i: number) => setWallets(prev => prev.filter((_, idx) => idx !== i));
  const updateWallet = (i: number, field: keyof WalletAccount, val: string) => setWallets(prev => prev.map((w, idx) => idx === i ? { ...w, [field]: val } : w));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "payment_bank_accounts", value: JSON.stringify(banks) }),
        updateSetting.mutateAsync({ key: "payment_wallet_accounts", value: JSON.stringify(wallets) }),
      ]);
      toast({ title: t("common.success"), description: t("settings.saved") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === "ar" ? "حسابات الدفع" : "Payment Accounts"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "إدارة الحسابات البنكية والمحافظ الإلكترونية" : "Manage bank accounts and e-wallets"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>

        {/* Bank Accounts */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              {lang === "ar" ? "حسابات الدفع البنكية" : "Bank Payment Accounts"}
            </h2>
            <Button size="sm" variant="outline" onClick={addBank} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> {t("common.add")}
            </Button>
          </div>
          {banks.map((b, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
              <Button size="icon" variant="ghost" onClick={() => removeBank(i)}
                className="absolute top-2 end-2 h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم الحساب (عربي)" : "Account Name (AR)"}</label>
                  <Input value={b.name_ar} onChange={e => updateBank(i, "name_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم الحساب (إنجليزي)" : "Account Name (EN)"}</label>
                  <Input value={b.name_en} onChange={e => updateBank(i, "name_en", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم البنك (عربي)" : "Bank Name (AR)"}</label>
                  <Input value={b.bank_ar} onChange={e => updateBank(i, "bank_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم البنك (إنجليزي)" : "Bank Name (EN)"}</label>
                  <Input value={b.bank_en} onChange={e => updateBank(i, "bank_en", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{lang === "ar" ? "رقم الحساب" : "Account Number"}</label>
                <Input value={b.number} onChange={e => updateBank(i, "number", e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "تعليمات (عربي)" : "Instructions (AR)"}</label>
                  <Input value={b.instructions_ar} onChange={e => updateBank(i, "instructions_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "تعليمات (إنجليزي)" : "Instructions (EN)"}</label>
                  <Input value={b.instructions_en} onChange={e => updateBank(i, "instructions_en", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {banks.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{lang === "ar" ? "لم تتم إضافة حسابات بنكية" : "No bank accounts added"}</p>}
        </div>

        {/* Wallet Accounts */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
              <Wallet className="h-5 w-5 text-secondary" />
              {lang === "ar" ? "حسابات المحافظ الإلكترونية" : "E-Wallet Accounts"}
            </h2>
            <Button size="sm" variant="outline" onClick={addWallet} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> {t("common.add")}
            </Button>
          </div>
          {wallets.map((w, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
              <Button size="icon" variant="ghost" onClick={() => removeWallet(i)}
                className="absolute top-2 end-2 h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم المحفظة (عربي)" : "Wallet Name (AR)"}</label>
                  <Input value={w.name_ar} onChange={e => updateWallet(i, "name_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "اسم المحفظة (إنجليزي)" : "Wallet Name (EN)"}</label>
                  <Input value={w.name_en} onChange={e => updateWallet(i, "name_en", e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "المزود (عربي)" : "Provider (AR)"}</label>
                  <Input value={w.provider_ar} onChange={e => updateWallet(i, "provider_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "المزود (إنجليزي)" : "Provider (EN)"}</label>
                  <Input value={w.provider_en} onChange={e => updateWallet(i, "provider_en", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{lang === "ar" ? "رقم الهاتف" : "Phone Number"}</label>
                <Input value={w.phone} onChange={e => updateWallet(i, "phone", e.target.value)} dir="ltr" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "تعليمات (عربي)" : "Instructions (AR)"}</label>
                  <Input value={w.instructions_ar} onChange={e => updateWallet(i, "instructions_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "تعليمات (إنجليزي)" : "Instructions (EN)"}</label>
                  <Input value={w.instructions_en} onChange={e => updateWallet(i, "instructions_en", e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          {wallets.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{lang === "ar" ? "لم تتم إضافة محافظ" : "No wallets added"}</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
