import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings } from "@/hooks/useAdminData";
import {
  LayoutDashboard, LogOut, Menu, X, Receipt, Building2, Settings, Crown,
  ChevronLeft, ChevronRight, Shield, Globe, Image,
  Palette, MessageCircle, Type, CreditCard, FileText, Database, UserX
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  labelKey: string;
  path: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { labelKey: "nav.dashboard", path: "/dean-othmanassdpro/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.owners", path: "/dean-othmanassdpro/owners", icon: Crown },
  { labelKey: "nav.subscriptions", path: "/dean-othmanassdpro/subscriptions", icon: CreditCard },
  { labelKey: "nav.trials", path: "/dean-othmanassdpro/trials", icon: Receipt },
  { labelKey: "nav.plans", path: "/dean-othmanassdpro/plans", icon: FileText },
  { labelKey: "nav.ads", path: "/dean-othmanassdpro/ads", icon: Image },
  { labelKey: "nav.branding", path: "/dean-othmanassdpro/branding", icon: Palette },
  { labelKey: "nav.contact", path: "/dean-othmanassdpro/contact", icon: MessageCircle },
  { labelKey: "nav.paymentAccounts", path: "/dean-othmanassdpro/payment-accounts", icon: Building2 },
  { labelKey: "nav.texts", path: "/dean-othmanassdpro/texts", icon: Type },
  { labelKey: "nav.settings", path: "/dean-othmanassdpro/settings", icon: Settings },
  { labelKey: "nav.backup", path: "/dean-othmanassdpro/backup", icon: Database },
  { labelKey: "nav.adminRequests", path: "/dean-othmanassdpro/requests", icon: UserX },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { t, lang, setLang, isRTL } = useLanguage();
  const { data: appSettings } = useAppSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const appName = appSettings ? (lang === "ar" ? (appSettings["app_name_ar"] || t("app.name")) : (appSettings["app_name_en"] || t("app.name"))) : t("app.name");
  const appIconUrl = appSettings?.["app_icon_url"] || "";

  if (!user || user.role !== "super_admin") {
    navigate("/dean-othmanassdpro/login");
    return null;
  }

  const roleLabel = t(`role.${user.role}`);
  const ActiveChevron = isRTL ? ChevronLeft : ChevronRight;

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-50 flex w-64 flex-col bg-sidebar transition-transform duration-300 lg:static lg:translate-x-0",
        isRTL ? "right-0" : "left-0",
        sidebarOpen
          ? "translate-x-0"
          : isRTL ? "translate-x-full" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary overflow-hidden">
            {appIconUrl ? <img src={appIconUrl} alt="" className="h-full w-full object-cover" /> : <Shield className="h-4 w-4 text-sidebar-primary-foreground" />}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-sidebar-accent-foreground">{appName}</span>
            <span className="text-[10px] text-sidebar-muted">{roleLabel}</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className={cn("lg:hidden text-sidebar-muted hover:text-sidebar-foreground", isRTL ? "mr-auto" : "ml-auto")}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-muted hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-[18px] w-[18px]" />
                {t(item.labelKey)}
                {active && <ActiveChevron className={cn("h-4 w-4", isRTL ? "mr-auto" : "ml-auto")} />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sidebar-primary to-blue-500 text-sm font-semibold text-white">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.name || "Admin"}</p>
            </div>
            <button onClick={handleLogout} className="text-sidebar-muted hover:text-sidebar-foreground transition-colors" title="Logout">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-3 border-b border-border bg-card/95 backdrop-blur-md px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground hover:text-foreground active:scale-95">
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setLang(lang === "ar" ? "en" : "ar")}
            className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Globe className="h-3 w-3" />
            {lang === "ar" ? "EN" : "عربي"}
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6 space-y-4">
          {children}
        </main>
      </div>
    </div>
  );
}
