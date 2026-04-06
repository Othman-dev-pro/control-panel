import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEffectiveStatus(profile: any) {
  // إذا لم يكن هناك ملف شخصي أو حالة اشتراك، فالحساب زبون أو موظف
  if (!profile || profile.subscription_status == null) return null;

  const now = new Date();
  
  // إذا كانت المنشأة موقوفة يدوياً أو تم إلغاء تفعيل اشتراكها، فهي منتهية
  if (profile.is_suspended || profile.is_subscription_active === false) return "expired";

  // 1. التحقق من تاريخ انتهاء الاشتراك المدفوع أولاً
  if (profile.subscription_ends_at && new Date(profile.subscription_ends_at) > now) {
    return "active";
  }

  // 2. التحقق من تاريخ انتهاء الفترة التجريبية ثانياً
  if (profile.trial_ends_at && new Date(profile.trial_ends_at) > now) {
    return "trial";
  }

  // إذا لم يتحقق أي مما سبق، فالحالة منتهية
  return "expired";
}
