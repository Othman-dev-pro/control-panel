import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Crown, ArrowLeft, ArrowRight } from "lucide-react";

export default function SubscriptionBanner() {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLanguage();

  if (!user || (user.role !== "owner" && user.role !== "employee")) return null;

  const status = user.subscription_status;
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  // Calculate days
  if (status === "trial") {
    const daysLeft = user.trial_ends_at
      ? Math.max(0, Math.ceil((new Date(user.trial_ends_at).getTime() - Date.now()) / 86400000))
      : 0;

    if (daysLeft <= 0) {
      // Expired trial
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-destructive text-sm">{t("sub.expired")}</p>
              <p className="text-xs text-destructive/80 mt-1">{t("sub.expiredBanner")}</p>
            </div>
            <Link
              to="/owner/subscription"
              className="flex items-center gap-1 shrink-0 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              {t("sub.goToSub")} <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      );
    }

    if (daysLeft <= 7) {
      // Warning: 7 days or less
      return (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                {t("sub.trialWarning").replace("{days}", String(daysLeft))}
              </p>
            </div>
            <Link
              to="/owner/subscription"
              className="flex items-center gap-1 shrink-0 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 transition-colors"
            >
              {t("sub.goToSub")} <Arrow className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      );
    }

    // Normal trial banner
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary shrink-0" />
          <p className="flex-1 text-sm font-medium text-primary">
            {t("sub.trialBanner").replace("{days}", String(daysLeft))}
          </p>
          <Link
            to="/owner/subscription"
            className="flex items-center gap-1 shrink-0 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
          >
            {t("sub.goToSub")} <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  if (status === "active") {
    const daysLeft = user.subscription_ends_at
      ? Math.max(0, Math.ceil((new Date(user.subscription_ends_at).getTime() - Date.now()) / 86400000))
      : 0;

    if (daysLeft > 0) {
      return (
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-3 mb-6">
          <div className="flex items-center gap-3">
            <Crown className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm font-medium text-accent">
              {t("sub.activeBanner").replace("{days}", String(daysLeft))}
            </p>
          </div>
        </div>
      );
    }
  }

  if (status === "expired") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-destructive text-sm">{t("sub.expired")}</p>
            <p className="text-xs text-destructive/80 mt-1">{t("sub.expiredBanner")}</p>
          </div>
          <Link
            to="/owner/subscription"
            className="flex items-center gap-1 shrink-0 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:bg-destructive/90 transition-colors"
          >
            {t("sub.goToSub")} <Arrow className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
