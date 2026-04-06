import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Plus, Trash2, MessageCircle, Phone } from "lucide-react";

interface ContactItem {
  type: "whatsapp" | "phone" | "email" | "address" | "hours";
  label_ar: string; label_en: string;
  value: string;
  href: string;
}

export default function AdminContact() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [whatsapp, setWhatsapp] = useState("");
  const [contacts, setContacts] = useState<ContactItem[]>([]);
  const [saving, setSaving] = useState(false);

  const defaultContacts: ContactItem[] = [
    { type: "whatsapp", label_ar: "واتساب", label_en: "WhatsApp", value: "+967 700 000 000", href: "https://wa.me/967700000000" },
    { type: "phone", label_ar: "هاتف", label_en: "Phone", value: "+967 700 000 000", href: "tel:+967700000000" },
    { type: "email", label_ar: "البريد الإلكتروني", label_en: "Email", value: "support@debtflow.app", href: "mailto:support@debtflow.app" },
    { type: "address", label_ar: "العنوان", label_en: "Address", value: "صنعاء، اليمن", href: "" },
    { type: "hours", label_ar: "ساعات العمل", label_en: "Working Hours", value: "9:00 AM - 5:00 PM", href: "" },
  ];

  useEffect(() => {
    if (settings) {
      setWhatsapp(settings["admin_whatsapp"] || "967700000099");
      try {
        const saved = JSON.parse(settings["contact_info"] || "[]");
        setContacts(saved.length > 0 ? saved : defaultContacts);
      } catch { setContacts(defaultContacts); }
    }
  }, [settings]);

  const contactTypes = [
    { value: "whatsapp", label: lang === "ar" ? "واتساب" : "WhatsApp" },
    { value: "phone", label: lang === "ar" ? "هاتف" : "Phone" },
    { value: "email", label: lang === "ar" ? "بريد إلكتروني" : "Email" },
    { value: "address", label: lang === "ar" ? "عنوان" : "Address" },
    { value: "hours", label: lang === "ar" ? "ساعات العمل" : "Working Hours" },
  ];

  const addContact = () => setContacts(prev => [...prev, { type: "whatsapp", label_ar: "", label_en: "", value: "", href: "" }]);
  const removeContact = (i: number) => setContacts(prev => prev.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: keyof ContactItem, val: string) => setContacts(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleSave = async () => {
    setSaving(true);
    try {
      await Promise.all([
        updateSetting.mutateAsync({ key: "admin_whatsapp", value: whatsapp }),
        updateSetting.mutateAsync({ key: "contact_info", value: JSON.stringify(contacts) }),
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
              {lang === "ar" ? "معلومات التواصل" : "Contact Information"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "إدارة رقم الواتساب ومعلومات التواصل" : "Manage WhatsApp number and contact info"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>

        {/* WhatsApp */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
            <MessageCircle className="h-5 w-5 text-accent" />
            {lang === "ar" ? "رقم واتساب التواصل" : "WhatsApp Contact Number"}
          </h2>
          <Input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="967700000099" dir="ltr" className="max-w-xs" />
          <p className="text-xs text-muted-foreground">{lang === "ar" ? "سيظهر هذا الرقم لأصحاب المنشآت للتواصل" : "This number will be shown to owners for contact"}</p>
        </div>

        {/* Contact Info */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-card-foreground">
              <Phone className="h-5 w-5 text-primary" />
              {lang === "ar" ? "معلومات التواصل (صفحة تواصل معنا)" : "Contact Info (Contact Us Page)"}
            </h2>
            <Button size="sm" variant="outline" onClick={addContact} className="gap-1.5 text-xs">
              <Plus className="h-3.5 w-3.5" /> {t("common.add")}
            </Button>
          </div>
          {contacts.map((c, i) => (
            <div key={i} className="rounded-lg border border-border p-4 space-y-3 relative">
              <Button size="icon" variant="ghost" onClick={() => removeContact(i)}
                className="absolute top-2 end-2 h-7 w-7 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "النوع" : "Type"}</label>
                  <select value={c.type} onChange={e => updateContact(i, "type", e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    {contactTypes.map(ct => (<option key={ct.value} value={ct.value}>{ct.label}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "القيمة" : "Value"}</label>
                  <Input value={c.value} onChange={e => updateContact(i, "value", e.target.value)} dir="ltr" placeholder={c.type === "email" ? "email@example.com" : "+967..."} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "التسمية (عربي)" : "Label (AR)"}</label>
                  <Input value={c.label_ar} onChange={e => updateContact(i, "label_ar", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">{lang === "ar" ? "التسمية (إنجليزي)" : "Label (EN)"}</label>
                  <Input value={c.label_en} onChange={e => updateContact(i, "label_en", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">{lang === "ar" ? "الرابط (اختياري)" : "Link (optional)"}</label>
                <Input value={c.href} onChange={e => updateContact(i, "href", e.target.value)} dir="ltr" placeholder="https://wa.me/967..." />
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p className="text-xs text-muted-foreground text-center py-3">{lang === "ar" ? "لم تتم إضافة معلومات تواصل" : "No contact info added"}</p>}
        </div>
      </div>
    </DashboardLayout>
  );
}
