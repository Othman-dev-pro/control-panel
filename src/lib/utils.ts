import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEffectiveStatus(profile: any) {
  // إذا لم يكن هناك حالة اشتراك (زبون أو موظف) نعيد null مباشرة
  if (!profile || profile.subscription_status == null) return null;

  let status = profile.subscription_status;
  const now = new Date();

  if (status === "trial" && profile.trial_ends_at) {
    if (new Date(profile.trial_ends_at) < now) {
      status = "expired";
    }
  } else if (status === "active" && profile.subscription_ends_at) {
    if (new Date(profile.subscription_ends_at) < now) {
      status = "expired";
    }
  }
  return status;
}
