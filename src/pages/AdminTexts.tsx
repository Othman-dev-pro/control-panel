import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppSettings, useUpdateSetting } from "@/hooks/useAdminData";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Search, Type } from "lucide-react";

// Key translation labels that admins commonly want to customize
// All translation keys from LanguageContext, organized by category
const editableKeys = [
  // App
  { key: "app.name", category: "app" },
  { key: "app.tagline", category: "app" },
  { key: "app.tagline.sub", category: "app" },
  { key: "app.copyright", category: "app" },

  // Common
  { key: "common.save", category: "common" },
  { key: "common.cancel", category: "common" },
  { key: "common.search", category: "common" },
  { key: "common.add", category: "common" },
  { key: "common.edit", category: "common" },
  { key: "common.delete", category: "common" },
  { key: "common.back", category: "common" },
  { key: "common.view", category: "common" },
  { key: "common.loading", category: "common" },
  { key: "common.noData", category: "common" },
  { key: "common.yer", category: "common" },
  { key: "common.settled", category: "common" },
  { key: "common.success", category: "common" },
  { key: "common.error", category: "common" },
  { key: "common.errorMsg", category: "common" },

  // Forms
  { key: "form.name", category: "form" },
  { key: "form.namePlaceholder", category: "form" },
  { key: "form.phone", category: "form" },
  { key: "form.address", category: "form" },
  { key: "form.addressPlaceholder", category: "form" },
  { key: "form.selectCustomer", category: "form" },
  { key: "form.selectDebt", category: "form" },
  { key: "form.descriptionPlaceholder", category: "form" },

  // Roles
  { key: "role.super_admin", category: "roles" },
  { key: "role.owner", category: "roles" },
  { key: "role.employee", category: "roles" },
  { key: "role.customer", category: "roles" },

  // Home
  { key: "home.selectRole", category: "home" },
  { key: "home.contactUs", category: "home" },

  // Login
  { key: "login.welcome", category: "login" },
  { key: "login.subtitle", category: "login" },
  { key: "login.iama", category: "login" },
  { key: "login.phone", category: "login" },
  { key: "login.phonePlaceholder", category: "login" },
  { key: "login.signin", category: "login" },
  { key: "login.admin", category: "login" },
  { key: "login.adminLink", category: "login" },
  { key: "login.notAdmin", category: "login" },
  { key: "login.regularLink", category: "login" },
  { key: "login.adminPortal", category: "login" },
  { key: "login.adminSubtitle", category: "login" },
  { key: "login.adminPhone", category: "login" },
  { key: "login.signinAdmin", category: "login" },
  { key: "login.email", category: "login" },
  { key: "login.emailPlaceholder", category: "login" },
  { key: "login.password", category: "login" },
  { key: "login.error", category: "login" },
  { key: "login.invalidCredentials", category: "login" },
  { key: "login.noRole", category: "login" },
  { key: "login.owner.title", category: "login" },
  { key: "login.owner.desc", category: "login" },
  { key: "login.employee.title", category: "login" },
  { key: "login.employee.desc", category: "login" },
  { key: "login.customer.title", category: "login" },
  { key: "login.customer.desc", category: "login" },
  { key: "login.username", category: "login" },
  { key: "login.usernamePlaceholder", category: "login" },
  { key: "login.noAccount", category: "login" },
  { key: "login.registerLink", category: "login" },
  { key: "login.forgotPassword", category: "login" },

  // Register
  { key: "register.title", category: "register" },
  { key: "register.subtitle", category: "register" },
  { key: "register.iama", category: "register" },
  { key: "register.sendOtp", category: "register" },
  { key: "register.otpSent", category: "register" },
  { key: "register.otpSentTo", category: "register" },
  { key: "register.verifyOtp", category: "register" },
  { key: "register.otpVerified", category: "register" },
  { key: "register.invalidOtp", category: "register" },
  { key: "register.changePhone", category: "register" },
  { key: "register.resendOtp", category: "register" },
  { key: "register.createAccount", category: "register" },
  { key: "register.success", category: "register" },
  { key: "register.roleAdded", category: "register" },
  { key: "register.hasAccount", category: "register" },
  { key: "register.userExists", category: "register" },
  { key: "register.businessName", category: "register" },
  { key: "register.businessNamePlaceholder", category: "register" },
  { key: "register.ownerName", category: "register" },
  { key: "register.ownerNamePlaceholder", category: "register" },
  { key: "register.businessAddress", category: "register" },
  { key: "register.businessAddressPlaceholder", category: "register" },

  // Forgot Password
  { key: "forgot.title", category: "forgot" },
  { key: "forgot.subtitle", category: "forgot" },
  { key: "forgot.newPassword", category: "forgot" },
  { key: "forgot.confirmPassword", category: "forgot" },
  { key: "forgot.passwordMismatch", category: "forgot" },
  { key: "forgot.resetButton", category: "forgot" },
  { key: "forgot.success", category: "forgot" },

  // Nav
  { key: "nav.dashboard", category: "nav" },
  { key: "nav.customers", category: "nav" },
  { key: "nav.debts", category: "nav" },
  { key: "nav.payments", category: "nav" },
  { key: "nav.employees", category: "nav" },
  { key: "nav.subscription", category: "nav" },
  { key: "nav.businesses", category: "nav" },
  { key: "nav.owners", category: "nav" },
  { key: "nav.subscriptions", category: "nav" },
  { key: "nav.plans", category: "nav" },
  { key: "nav.trials", category: "nav" },
  { key: "nav.settings", category: "nav" },
  { key: "nav.ads", category: "nav" },
  { key: "nav.reports", category: "nav" },
  { key: "nav.branding", category: "nav" },
  { key: "nav.contact", category: "nav" },
  { key: "nav.paymentAccounts", category: "nav" },
  { key: "nav.texts", category: "nav" },
  { key: "nav.orders", category: "nav" },

  // Owner Dashboard
  { key: "owner.welcome", category: "owner" },
  { key: "owner.welcomeSub", category: "owner" },
  { key: "owner.welcomeToday", category: "owner" },
  { key: "owner.totalCustomers", category: "owner" },
  { key: "owner.totalDebts", category: "owner" },
  { key: "owner.totalPayments", category: "owner" },
  { key: "owner.balance", category: "owner" },
  { key: "owner.recentActivity", category: "owner" },
  { key: "owner.activeDebts", category: "owner" },
  { key: "owner.thisMonth", category: "owner" },
  { key: "owner.outstanding", category: "owner" },
  { key: "owner.thisWeek", category: "owner" },

  // Activity
  { key: "activity.newDebt", category: "activity" },
  { key: "activity.payment", category: "activity" },
  { key: "activity.minAgo", category: "activity" },
  { key: "activity.hourAgo", category: "activity" },
  { key: "activity.hoursAgo", category: "activity" },

  // Customers
  { key: "customers.title", category: "customers" },
  { key: "customers.total", category: "customers" },
  { key: "customers.add", category: "customers" },
  { key: "customers.searchPlaceholder", category: "customers" },
  { key: "customers.balance", category: "customers" },
  { key: "customers.debtsCount", category: "customers" },
  { key: "customers.noResults", category: "customers" },
  { key: "customers.trySearch", category: "customers" },
  { key: "customers.created", category: "customers" },
  { key: "customers.createdLinked", category: "customers" },
  { key: "customers.updated", category: "customers" },
  { key: "customers.deleted", category: "customers" },
  { key: "customers.cannotDeleteHasDebt", category: "customers" },
  { key: "customers.deactivated", category: "customers" },
  { key: "customers.activated", category: "customers" },
  { key: "customers.deactivate", category: "customers" },
  { key: "customers.activate", category: "customers" },
  { key: "customers.inactive", category: "customers" },
  { key: "customers.edit", category: "customers" },
  { key: "customers.debtLimit", category: "customers" },
  { key: "customers.debtLimitPlaceholder", category: "customers" },
  { key: "customers.debtLimitNote", category: "customers" },
  { key: "customers.debtLimitLocked", category: "customers" },
  { key: "customer.businesses", category: "customers" },
  { key: "customer.businessesSub", category: "customers" },
  { key: "customer.accountDetails", category: "customers" },
  { key: "customer.totalDebts", category: "customers" },
  { key: "customer.totalPayments", category: "customers" },
  { key: "customer.noBusinesses", category: "customers" },
  { key: "customer.debtLimitInfo", category: "customers" },

  // Debts
  { key: "debts.title", category: "debts" },
  { key: "debts.subtitle", category: "debts" },
  { key: "debts.new", category: "debts" },
  { key: "debts.customer", category: "debts" },
  { key: "debts.amount", category: "debts" },
  { key: "debts.description", category: "debts" },
  { key: "debts.date", category: "debts" },
  { key: "debts.status", category: "debts" },
  { key: "debts.unpaid", category: "debts" },
  { key: "debts.partial", category: "debts" },
  { key: "debts.paid", category: "debts" },
  { key: "debts.noDebts", category: "debts" },
  { key: "debts.viewImage", category: "debts" },
  { key: "debts.attachedImage", category: "debts" },
  { key: "debts.created", category: "debts" },
  { key: "debts.deleted", category: "debts" },
  { key: "debts.debtLimitExceeded", category: "debts" },
  { key: "debts.attachImage", category: "debts" },
  { key: "debts.takePhoto", category: "debts" },

  // Payments
  { key: "payments.title", category: "payments" },
  { key: "payments.subtitle", category: "payments" },
  { key: "payments.record", category: "payments" },
  { key: "payments.noPayments", category: "payments" },
  { key: "payments.exceedsBalance", category: "payments" },
  { key: "payments.noOutstandingDebts", category: "payments" },
  { key: "payments.created", category: "payments" },

  // Employees
  { key: "employees.title", category: "employees" },
  { key: "employees.subtitle", category: "employees" },
  { key: "employees.add", category: "employees" },
  { key: "employees.noEmployees", category: "employees" },
  { key: "employees.active", category: "employees" },
  { key: "employees.inactive", category: "employees" },
  { key: "employees.created", category: "employees" },
  { key: "employees.updated", category: "employees" },
  { key: "employees.deleted", category: "employees" },
  { key: "employees.edit", category: "employees" },
  { key: "employees.passwordOptional", category: "employees" },

  // Orders
  { key: "orders.title", category: "orders" },
  { key: "orders.subtitle", category: "orders" },
  { key: "orders.ownerSubtitle", category: "orders" },
  { key: "orders.requestDebt", category: "orders" },
  { key: "orders.requestPayment", category: "orders" },
  { key: "orders.debtRequest", category: "orders" },
  { key: "orders.paymentRequest", category: "orders" },
  { key: "orders.myOrders", category: "orders" },
  { key: "orders.pending", category: "orders" },
  { key: "orders.approved", category: "orders" },
  { key: "orders.rejected", category: "orders" },
  { key: "orders.pendingCount", category: "orders" },
  { key: "orders.selectBusiness", category: "orders" },
  { key: "orders.paymentMethod", category: "orders" },
  { key: "orders.cash", category: "orders" },
  { key: "orders.wallets", category: "orders" },
  { key: "orders.banks", category: "orders" },
  { key: "orders.transferTo", category: "orders" },
  { key: "orders.phoneNumber", category: "orders" },
  { key: "orders.accountName", category: "orders" },
  { key: "orders.accountNamePlaceholder", category: "orders" },
  { key: "orders.pointNumber", category: "orders" },
  { key: "orders.pointNumberPlaceholder", category: "orders" },
  { key: "orders.accountNumber", category: "orders" },
  { key: "orders.accountNumberPlaceholder", category: "orders" },
  { key: "orders.transactionNumber", category: "orders" },
  { key: "orders.transactionNumberPlaceholder", category: "orders" },
  { key: "orders.senderName", category: "orders" },
  { key: "orders.senderNamePlaceholder", category: "orders" },
  { key: "orders.bankPoint", category: "orders" },
  { key: "orders.bankTransfer", category: "orders" },
  { key: "orders.send", category: "orders" },
  { key: "orders.sent", category: "orders" },
  { key: "orders.fillRequired", category: "orders" },
  { key: "orders.selectPaymentMethod", category: "orders" },
  { key: "orders.noOrders", category: "orders" },
  { key: "orders.noPaymentMethods", category: "orders" },
  { key: "orders.approve", category: "orders" },
  { key: "orders.reject", category: "orders" },
  { key: "orders.rejectOrder", category: "orders" },
  { key: "orders.rejectionReason", category: "orders" },
  { key: "orders.rejectionReasonPlaceholder", category: "orders" },
  { key: "orders.orderApproved", category: "orders" },
  { key: "orders.orderRejected", category: "orders" },
  { key: "orders.debtLimitExceeded", category: "orders" },
  { key: "orders.orderAlreadyProcessed", category: "orders" },

  // Subscription
  { key: "sub.title", category: "subscription" },
  { key: "sub.subtitle", category: "subscription" },
  { key: "sub.trialDays", category: "subscription" },
  { key: "sub.active", category: "subscription" },
  { key: "sub.expired", category: "subscription" },
  { key: "sub.expiredMsg", category: "subscription" },
  { key: "sub.plans", category: "subscription" },
  { key: "sub.monthly", category: "subscription" },
  { key: "sub.quarterly", category: "subscription" },
  { key: "sub.yearly", category: "subscription" },
  { key: "sub.days", category: "subscription" },
  { key: "sub.mostPopular", category: "subscription" },
  { key: "sub.unlimitedCustomers", category: "subscription" },
  { key: "sub.unlimitedDebts", category: "subscription" },
  { key: "sub.pdfReports", category: "subscription" },
  { key: "sub.notifications", category: "subscription" },
  { key: "sub.everythingMonthly", category: "subscription" },
  { key: "sub.prioritySupport", category: "subscription" },
  { key: "sub.employeeAccounts", category: "subscription" },
  { key: "sub.advancedReports", category: "subscription" },
  { key: "sub.everythingQuarterly", category: "subscription" },
  { key: "sub.dedicatedSupport", category: "subscription" },
  { key: "sub.customBranding", category: "subscription" },
  { key: "sub.apiAccess", category: "subscription" },
  { key: "sub.bankAccounts", category: "subscription" },
  { key: "sub.walletAccounts", category: "subscription" },
  { key: "sub.accountName", category: "subscription" },
  { key: "sub.bankName", category: "subscription" },
  { key: "sub.accountNumber", category: "subscription" },
  { key: "sub.walletPhone", category: "subscription" },
  { key: "sub.instructions", category: "subscription" },
  { key: "sub.contactAdmin", category: "subscription" },
  { key: "sub.whatsappMsg", category: "subscription" },
  { key: "sub.trialBanner", category: "subscription" },
  { key: "sub.trialWarning", category: "subscription" },
  { key: "sub.expiredBanner", category: "subscription" },
  { key: "sub.activeBanner", category: "subscription" },
  { key: "sub.goToSub", category: "subscription" },

  // Settings
  { key: "settings.title", category: "settings" },
  { key: "settings.subtitle", category: "settings" },
  { key: "settings.businessInfo", category: "settings" },
  { key: "settings.saved", category: "settings" },
  { key: "settings.language", category: "settings" },
  { key: "settings.languageDesc", category: "settings" },
  { key: "settings.security", category: "settings" },
  { key: "settings.securityDesc", category: "settings" },
  { key: "settings.notifications", category: "settings" },
  { key: "settings.notificationsDesc", category: "settings" },
  { key: "settings.data", category: "settings" },
  { key: "settings.dataDesc", category: "settings" },
  { key: "settings.adminInfo", category: "settings" },
  { key: "settings.paymentMethods", category: "settings" },
  { key: "settings.addPaymentMethod", category: "settings" },
  { key: "settings.paymentMethodAdded", category: "settings" },
  { key: "settings.paymentMethodDeleted", category: "settings" },
  { key: "settings.noPaymentMethods", category: "settings" },
  { key: "settings.methodType", category: "settings" },
  { key: "settings.provider", category: "settings" },
  { key: "settings.selectProvider", category: "settings" },

  // Contact
  { key: "contact.title", category: "contact" },
  { key: "contact.subtitle", category: "contact" },
  { key: "contact.whatsapp", category: "contact" },
  { key: "contact.phone", category: "contact" },
  { key: "contact.email", category: "contact" },
  { key: "contact.address", category: "contact" },
  { key: "contact.addressValue", category: "contact" },
  { key: "contact.hours", category: "contact" },
  { key: "contact.hoursValue", category: "contact" },

  // Reports
  { key: "reports.title", category: "reports" },
  { key: "reports.subtitle", category: "reports" },
  { key: "reports.downloadPdf", category: "reports" },
  { key: "reports.filters", category: "reports" },
  { key: "reports.dateFrom", category: "reports" },
  { key: "reports.dateTo", category: "reports" },
  { key: "reports.customer", category: "reports" },
  { key: "reports.customerBreakdown", category: "reports" },
  { key: "reports.debtsLabel", category: "reports" },
  { key: "reports.paymentsLabel", category: "reports" },
  { key: "reports.ordersStats", category: "reports" },

  // Admin
  { key: "admin.overview", category: "admin" },
  { key: "admin.subtitle", category: "admin" },
  { key: "admin.totalOwners", category: "admin" },
  { key: "admin.activeSubscriptions", category: "admin" },
  { key: "admin.totalCustomers", category: "admin" },
  { key: "admin.monthlyRevenue", category: "admin" },
  { key: "admin.recentOwners", category: "admin" },
  { key: "admin.owner", category: "admin" },
  { key: "admin.business", category: "admin" },
  { key: "admin.phone", category: "admin" },
  { key: "admin.status", category: "admin" },
  { key: "admin.action", category: "admin" },
  { key: "admin.activate", category: "admin" },
  { key: "admin.trial", category: "admin" },
  { key: "admin.active", category: "admin" },
  { key: "admin.expired", category: "admin" },
  { key: "admin.thisMonth", category: "admin" },
  { key: "admin.subscriptionDate", category: "admin" },
  { key: "admin.percentActive", category: "admin" },
  { key: "admin.activated", category: "admin" },
  { key: "admin.ownersSubtitle", category: "admin" },
  { key: "admin.searchOwners", category: "admin" },
  { key: "admin.subscriptionsSub", category: "admin" },
  { key: "admin.all", category: "admin" },
  { key: "admin.month", category: "admin" },
  { key: "admin.months", category: "admin" },
  { key: "admin.plansTitle", category: "admin" },
  { key: "admin.plansSub", category: "admin" },
];

const categories = [
  { value: "all", ar: "الكل", en: "All" },
  { value: "app", ar: "التطبيق", en: "App" },
  { value: "common", ar: "عام", en: "Common" },
  { value: "form", ar: "النماذج", en: "Forms" },
  { value: "roles", ar: "الأدوار", en: "Roles" },
  { value: "home", ar: "الرئيسية", en: "Home" },
  { value: "login", ar: "تسجيل الدخول", en: "Login" },
  { value: "register", ar: "التسجيل", en: "Register" },
  { value: "forgot", ar: "نسيان كلمة المرور", en: "Forgot Password" },
  { value: "nav", ar: "القائمة", en: "Navigation" },
  { value: "owner", ar: "لوحة المالك", en: "Owner Dashboard" },
  { value: "activity", ar: "النشاط", en: "Activity" },
  { value: "customers", ar: "الزبائن", en: "Customers" },
  { value: "debts", ar: "الديون", en: "Debts" },
  { value: "payments", ar: "المدفوعات", en: "Payments" },
  { value: "employees", ar: "الموظفين", en: "Employees" },
  { value: "orders", ar: "الطلبات", en: "Orders" },
  { value: "subscription", ar: "الاشتراك", en: "Subscription" },
  { value: "settings", ar: "الإعدادات", en: "Settings" },
  { value: "contact", ar: "التواصل", en: "Contact" },
  { value: "reports", ar: "التقارير", en: "Reports" },
  { value: "admin", ar: "الإدارة", en: "Admin" },
];

export default function AdminTexts() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const { data: settings, isLoading } = useAppSettings();
  const updateSetting = useUpdateSetting();

  const [overrides, setOverrides] = useState<Record<string, { ar: string; en: string }>>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      try {
        const saved = JSON.parse(settings["text_overrides"] || "{}");
        setOverrides(saved);
      } catch { setOverrides({}); }
    }
  }, [settings]);

  const handleChange = (key: string, langKey: "ar" | "en", value: string) => {
    setOverrides(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { ar: "", en: "" }), [langKey]: value },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Remove empty overrides
      const cleaned: Record<string, { ar: string; en: string }> = {};
      Object.entries(overrides).forEach(([k, v]) => {
        if (v.ar || v.en) cleaned[k] = v;
      });
      await updateSetting.mutateAsync({ key: "text_overrides", value: JSON.stringify(cleaned) });
      toast({ title: t("common.success"), description: t("settings.saved") });
    } catch {
      toast({ variant: "destructive", title: t("common.error"), description: t("common.errorMsg") });
    } finally {
      setSaving(false);
    }
  };

  const filtered = editableKeys.filter(item => {
    if (category !== "all" && item.category !== category) return false;
    if (search) {
      const defaultAr = t(item.key);
      const defaultEn = item.key;
      return defaultAr.includes(search) || defaultEn.includes(search) || item.key.includes(search);
    }
    return true;
  });

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {lang === "ar" ? "تخصيص النصوص" : "Customize Texts"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "ar" ? "تغيير النصوص الظاهرة في التطبيق" : "Change displayed texts across the app"}
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("common.save")}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${lang === "ar" ? "right-3" : "left-3"}`} />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={lang === "ar" ? "بحث..." : "Search..."} className={lang === "ar" ? "pr-9" : "pl-9"} />
          </div>
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            {categories.map(c => <option key={c.value} value={c.value}>{lang === "ar" ? c.ar : c.en}</option>)}
          </select>
        </div>

        <p className="text-xs text-muted-foreground">
          {lang === "ar" ? "اترك الحقل فارغاً لاستخدام النص الافتراضي" : "Leave empty to use default text"}
        </p>

        {/* Text items */}
        <div className="space-y-3">
          {filtered.map(item => {
            const override = overrides[item.key] || { ar: "", en: "" };
            return (
              <div key={item.key} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Type className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-mono text-muted-foreground">{item.key}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-muted-foreground">{lang === "ar" ? "عربي" : "Arabic"}</label>
                    <Input
                      value={override.ar}
                      onChange={e => handleChange(item.key, "ar", e.target.value)}
                      placeholder={t(item.key)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground">{lang === "ar" ? "إنجليزي" : "English"}</label>
                    <Input
                      value={override.en}
                      onChange={e => handleChange(item.key, "en", e.target.value)}
                      placeholder={item.key}
                      dir="ltr"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {lang === "ar" ? "لا توجد نتائج" : "No results found"}
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
