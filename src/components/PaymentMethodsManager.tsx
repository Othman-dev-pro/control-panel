import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Wallet, Building, Edit2 } from "lucide-react";

const PROVIDERS: Record<string, { id: string; name: string }[]> = {
  wallet: [
    { id: "jeeb", name: "جيب" },
    { id: "jawali", name: "جوالي" },
    { id: "floosak", name: "فلوسك" },
    { id: "onecash", name: "ون كاش" },
    { id: "cash", name: "كاش" },
    { id: "mobimoney", name: "موبايل موني" },
  ],
  bank: [
    { id: "alkuraimi", name: "بنك الكريمي" },
  ],
};

export default function PaymentMethodsManager() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [showDialog, setShowDialog] = useState(false);
  const [type, setType] = useState("wallet");
  const [provider, setProvider] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [pointNumber, setPointNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data: methods, isLoading } = useQuery({
    queryKey: ["my-payment-methods"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_methods").select("*").order("created_at");
      return data || [];
    },
  });

  const resetForm = () => {
    setShowDialog(false);
    setType("wallet");
    setProvider("");
    setAccountName("");
    setAccountNumber("");
    setPointNumber("");
    setPhoneNumber("");
  };

  const handleSave = async () => {
    if (!provider || !user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("payment_methods").insert({
        owner_id: user.id,
        type,
        provider,
        account_name: accountName || null,
        account_number: accountNumber || null,
        point_number: pointNumber || null,
        phone_number: phoneNumber || null,
      });
      if (error) throw error;
      toast({ title: t("common.success"), description: t("settings.paymentMethodAdded") });
      qc.invalidateQueries({ queryKey: ["my-payment-methods"] });
      resetForm();
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await supabase.from("payment_methods").delete().eq("id", id);
      qc.invalidateQueries({ queryKey: ["my-payment-methods"] });
      toast({ title: t("common.success"), description: t("settings.paymentMethodDeleted") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setDeleting(null);
    }
  };

  const providerName = (providerId: string) => {
    for (const arr of Object.values(PROVIDERS)) {
      const found = arr.find(p => p.id === providerId);
      if (found) return found.name;
    }
    return providerId;
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-card-foreground">{t("settings.paymentMethods")}</h2>
        <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {t("common.add")}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : methods && methods.length > 0 ? (
        <div className="space-y-2">
          {methods.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                {m.type === "wallet" ? (
                  <Wallet className="h-4 w-4 text-primary" />
                ) : (
                  <Building className="h-4 w-4 text-primary" />
                )}
                <div>
                  <p className="text-sm font-medium text-card-foreground">{providerName(m.provider)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.account_name && `${m.account_name} • `}
                    {m.phone_number || m.account_number || m.point_number || ""}
                  </p>
                </div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => handleDelete(m.id)}
                disabled={deleting === m.id}
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
              >
                {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-4">{t("settings.noPaymentMethods")}</p>
      )}

      {/* Add Dialog */}
      <Dialog open={showDialog} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("settings.addPaymentMethod")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.methodType")}</Label>
              <Select value={type} onValueChange={v => { setType(v); setProvider(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">{t("orders.wallets")}</SelectItem>
                  <SelectItem value="bank">{t("orders.banks")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.provider")}</Label>
              <Select value={provider} onValueChange={setProvider}>
                <SelectTrigger><SelectValue placeholder={t("settings.selectProvider")} /></SelectTrigger>
                <SelectContent>
                  {(PROVIDERS[type] || []).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("orders.accountName")}</Label>
              <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder={t("orders.accountNamePlaceholder")} />
            </div>

            <div className="space-y-2">
              <Label>{t("orders.phoneNumber")}</Label>
              <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="7XXXXXXXX" dir="ltr" />
            </div>

            {type === "bank" && (
              <>
                <div className="space-y-2">
                  <Label>{t("orders.accountNumber")}</Label>
                  <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={t("orders.accountNumberPlaceholder")} dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label>{t("orders.pointNumber")}</Label>
                  <Input value={pointNumber} onChange={e => setPointNumber(e.target.value)} placeholder={t("orders.pointNumberPlaceholder")} dir="ltr" />
                </div>
              </>
            )}

            {type === "wallet" && (
              <div className="space-y-2">
                <Label>{t("orders.pointNumber")}</Label>
                <Input value={pointNumber} onChange={e => setPointNumber(e.target.value)} placeholder={t("orders.pointNumberPlaceholder")} dir="ltr" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleSave} disabled={!provider || saving} className="w-full gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
