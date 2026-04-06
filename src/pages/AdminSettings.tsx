import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Globe } from "lucide-react";

export default function AdminSettings() {
  const { t, lang, setLang } = useLanguage();
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("nav.settings")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        {/* Language */}
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-card-foreground">{t("settings.language")}</p>
            <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
          </div>
          <button onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            {lang === "ar" ? "English" : "عربي"}
          </button>
        </div>

        {/* Admin Info */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-card-foreground mb-3">{t("settings.adminInfo")}</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("form.name")}</span>
              <span className="font-medium text-foreground">{user?.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("login.email")}</span>
              <span className="font-medium text-foreground" dir="ltr">{user?.email || "-"}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
