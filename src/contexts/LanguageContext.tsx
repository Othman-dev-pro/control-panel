import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAppSettings } from "@/hooks/useAdminData";

export type Language = "ar" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
  isRTL: boolean;
  formatCurrency: (amount: number) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    // Common
    "app.name": "ديبت فلو",
    "app.tagline": "إدارة ذكية للديون للمنشآت الحديثة",
    "app.tagline.sub": "تتبع ديون العملاء، سجل المدفوعات، وأدر مالية منشأتك بسهولة.",
    "app.copyright": "© 2026 ديبت فلو. جميع الحقوق محفوظة.",
    "common.save": "حفظ",
    "common.cancel": "إلغاء",
    "common.search": "بحث",
    "common.add": "إضافة",
    "common.edit": "تعديل",
    "common.delete": "حذف",
    "common.back": "رجوع",
    "common.view": "عرض",
    "common.loading": "جاري التحميل...",
    "common.noData": "لا توجد بيانات",
    "common.yer": "ر.ي",
    "common.settled": "مسدد",
    "common.success": "تم بنجاح",
    "common.error": "خطأ",
    "common.errorMsg": "حدث خطأ، حاول مجدداً",

    // Forms
    "form.name": "الاسم",
    "form.namePlaceholder": "أدخل الاسم",
    "form.phone": "رقم الهاتف",
    "form.address": "العنوان",
    "form.addressPlaceholder": "أدخل العنوان",
    "form.selectCustomer": "اختر الزبون",
    "form.selectDebt": "اختر الدين",
    "form.descriptionPlaceholder": "أدخل التفاصيل",

    // CRUD messages
    "customers.created": "تم إضافة الزبون بنجاح",
    "customers.createdLinked": "تم إضافة الزبون وربطه بحسابه المسجل تلقائياً",
    "customers.updated": "تم تحديث بيانات الزبون",
    "customers.deleted": "تم حذف الزبون",
    "customers.cannotDeleteHasDebt": "لا يمكن حذف الزبون لأن عليه رصيد دين",
    "customers.deactivated": "تم إلغاء تفعيل الزبون",
    "customers.activated": "تم تفعيل الزبون",
    "customers.deactivate": "إلغاء التفعيل",
    "customers.activate": "تفعيل",
    "customers.inactive": "غير مفعل",
    "customers.edit": "تعديل الزبون",
    "customers.debtLimit": "سقف الدين",
    "customers.debtLimitOptional": "سقف الدين (اختياري)",
    "customers.debtLimitPlaceholder": "مثال: 50000 (اتركه فارغ لعدم التحديد)",
    "debts.created": "تم تسجيل الدين بنجاح",
    "debts.deleted": "تم حذف الدين",
    "debts.debtLimitExceeded": "تم تجاوز سقف الدين المحدد لهذا الزبون",
    "customers.debtLimitNote": "⚠️ لا يمكن تعديل سقف الدين إلا بعد مرور شهر من أول حركة في حساب الزبون",
    "customers.debtLimitLocked": "لا يمكن تعديل سقف الدين حالياً. يجب الانتظار شهر من أول حركة في الحساب",
    "orders.debtLimitExceeded": "تم رفض الطلب تلقائياً لأن المبلغ يتجاوز سقف الدين المحدد للزبون",
    "orders.orderAlreadyProcessed": "تم معالجة هذا الطلب مسبقاً",
    "customer.debtLimitInfo": "سقف الدين المحدد لك",
    "debts.attachImage": "إرفاق صورة (اختياري)",
    "debts.takePhoto": "التقاط صورة أو اختيار ملف",
    "payments.created": "تم تسجيل السداد بنجاح",
    "admin.activated": "تم تفعيل الاشتراك بنجاح",

    // Roles
    "role.super_admin": "مدير النظام",
    "role.owner": "مالك المنشأة",
    "role.employee": "موظف",
    "role.customer": "زبون",

    // Login
    "login.welcome": "مرحباً بعودتك",
    "login.subtitle": "سجل دخولك إلى حسابك",
    "login.iama": "أنا",
    "login.phone": "رقم الهاتف",
    "login.phonePlaceholder": "‎+967 7XX XXX XXX",
    "login.signin": "تسجيل الدخول",
    "login.admin": "مدير النظام؟",
    "login.adminLink": "سجل دخول من هنا",
    "login.notAdmin": "لست مدير نظام؟",
    "login.regularLink": "الدخول العادي",
    "login.adminPortal": "بوابة مدير النظام",
    "login.adminSubtitle": "إدارة نظام ديبت فلو",
    "login.adminPhone": "هاتف المدير",
    "login.signinAdmin": "دخول كمدير النظام",
    "login.email": "البريد الإلكتروني",
    "login.emailPlaceholder": "admin@example.com",
    "login.password": "كلمة المرور",
    "login.error": "خطأ",
    "login.invalidCredentials": "بيانات تسجيل الدخول غير صحيحة",
    "login.noRole": "ليس لديك حساب بهذا الدور. يرجى التسجيل أولاً",
    "login.owner.title": "مالك منشأة",
    "login.owner.desc": "إدارة ديون منشأتك",
    "login.employee.title": "موظف",
    "login.employee.desc": "الوصول لحساب المنشأة",
    "login.customer.title": "زبون",
    "login.customer.desc": "عرض ديونك ومدفوعاتك",

    // Nav
    "nav.dashboard": "لوحة التحكم",
    "nav.customers": "الزبائن",
    "nav.debts": "الديون",
    "nav.payments": "المدفوعات",
    "nav.employees": "الموظفين",
    "nav.subscription": "الاشتراك",
    "nav.businesses": "محلاتي",
    "nav.owners": "المنشآت",
    "nav.subscriptions": "الاشتراكات",
    "nav.plans": "الخطط",
    "nav.trials": "الفترات التجريبية",
    "nav.settings": "الإعدادات",
    "nav.ads": "الإعلانات",
    "nav.reports": "التقارير",
    "nav.branding": "هوية التطبيق",
    "nav.contact": "التواصل",
    "nav.paymentAccounts": "حسابات الدفع",
    "nav.texts": "النصوص",

    // Owner Dashboard
    "owner.welcome": "مرحباً،",
    "owner.welcomeSub": "إليك ما يجري في",
    "owner.welcomeToday": "اليوم.",
    "owner.totalCustomers": "إجمالي الزبائن",
    "owner.totalDebts": "إجمالي الديون",
    "owner.totalPayments": "إجمالي المدفوعات",
    "owner.balance": "الرصيد",
    "owner.recentActivity": "النشاط الأخير",
    "owner.activeDebts": "دين نشط",
    "owner.thisMonth": "هذا الشهر",
    "owner.outstanding": "متبقي",
    "owner.thisWeek": "هذا الأسبوع",

    // Activity
    "activity.newDebt": "دين جديد بقيمة {amount} ر.ي على {name}",
    "activity.payment": "سداد بقيمة {amount} ر.ي من {name}",
    "activity.minAgo": "منذ {n} دقيقة",
    "activity.hourAgo": "منذ {n} ساعة",
    "activity.hoursAgo": "منذ {n} ساعات",

    // Customers
    "customers.title": "الزبائن",
    "customers.total": "إجمالي الزبائن",
    "customers.add": "إضافة زبون",
    "customers.searchPlaceholder": "بحث بالاسم أو رقم الهاتف...",
    "customers.balance": "الرصيد",
    "customers.debtsCount": "الديون",
    "customers.noResults": "لا يوجد زبائن",
    "customers.trySearch": "جرب كلمة بحث مختلفة",

    // Debts
    "debts.title": "الديون",
    "debts.subtitle": "إدارة ديون الزبائن",
    "debts.new": "تسجيل دين جديد",
    "debts.customer": "الزبون",
    "debts.amount": "المبلغ",
    "debts.description": "التفاصيل",
    "debts.date": "التاريخ",
    "debts.operationNumber": "رقم العملية",
    "debts.status": "الحالة",
    "debts.unpaid": "غير مسدد",
    "debts.partial": "مسدد جزئياً",
    "debts.paid": "مسدد",
    "debts.noDebts": "لا توجد ديون",
    "debts.viewImage": "عرض الصورة",
    "debts.attachedImage": "صورة مرفقة",

    // Payments
    "payments.title": "المدفوعات",
    "payments.subtitle": "تسجيل وتتبع المدفوعات",
    "payments.record": "تسجيل سداد",
    "payments.noPayments": "لا توجد مدفوعات",
    "payments.exceedsBalance": "المبلغ يتجاوز الرصيد المتبقي على الزبون",
    "payments.excessReturned": "سيتم تسجيل المستحق فقط وإرجاع المبلغ الزائد وقدره",
    "payments.noOutstandingDebts": "لا توجد ديون مستحقة على هذا الزبون",

    // Employees
    "employees.title": "الموظفين",
    "employees.subtitle": "إدارة فريق العمل",
    "employees.add": "إضافة موظف",
    "employees.noEmployees": "لا يوجد موظفين",
    "employees.active": "نشط",
    "employees.inactive": "غير نشط",

    // Subscription
    "sub.title": "الاشتراك",
    "sub.subtitle": "إدارة خطة اشتراكك",
    "sub.trialDays": "فترة تجريبية — متبقي {days} يوم",
    "sub.active": "الاشتراك نشط",
    "sub.expired": "الاشتراك منتهي",
    "sub.expiredMsg": "يرجى تحويل المبلغ والتواصل مع الإدارة لتفعيل حسابك.",
    "sub.plans": "خطط الاشتراك",
    "sub.monthly": "شهري",
    "sub.quarterly": "ربع سنوي",
    "sub.yearly": "سنوي",
    "sub.days": "يوم",
    "sub.mostPopular": "الأكثر طلباً",
    "sub.unlimitedCustomers": "زبائن غير محدودين",
    "sub.unlimitedDebts": "ديون غير محدودة",
    "sub.pdfReports": "تقارير PDF",
    "sub.notifications": "إشعارات",
    "sub.everythingMonthly": "كل مميزات الشهري",
    "sub.prioritySupport": "دعم أولوية",
    "sub.employeeAccounts": "حسابات موظفين",
    "sub.advancedReports": "تقارير متقدمة",
    "sub.everythingQuarterly": "كل مميزات الربع سنوي",
    "sub.dedicatedSupport": "دعم مخصص",
    "sub.customBranding": "علامة تجارية مخصصة",
    "sub.apiAccess": "وصول API",
    "sub.bankAccounts": "حسابات الدفع البنكية",
    "sub.walletAccounts": "حسابات المحفظة",
    "sub.accountName": "اسم الحساب",
    "sub.bankName": "اسم البنك",
    "sub.accountNumber": "رقم الحساب",
    "sub.walletPhone": "رقم الهاتف",
    "sub.instructions": "التعليمات",
    "sub.contactAdmin": "تواصل مع الإدارة عبر واتساب",
    "sub.whatsappMsg": "مرحباً، لقد قمت بتحويل مبلغ الاشتراك وأريد تفعيل حسابي. رقم هاتفي هو: ",

    // Customer
    "customer.businesses": "محلاتي",
    "customer.businessesSub": "عرض حساباتك في المحلات المختلفة",
    "customer.accountDetails": "تفاصيل الحساب",
    "customer.totalDebts": "إجمالي الديون",
    "customer.totalPayments": "إجمالي المدفوعات",

    // Admin
    "admin.overview": "نظرة عامة على النظام",
    "admin.subtitle": "إدارة منصة ديبت فلو",
    "admin.totalOwners": "إجمالي المنشآت",
    "admin.activeSubscriptions": "اشتراكات نشطة",
    "admin.totalCustomers": "إجمالي الزبائن",
    "admin.monthlyRevenue": "الإيرادات الشهرية",
    "admin.recentOwners": "المنشآت الأخيرة",
    "admin.owner": "المالك",
    "admin.business": "المنشأة",
    "admin.phone": "الهاتف",
    "admin.status": "الحالة",
    "admin.action": "إجراء",
    "admin.activate": "تفعيل",
    "admin.trial": "تجريبي",
    "admin.active": "نشط",
    "admin.expired": "منتهي",
    "admin.thisMonth": "هذا الشهر",
    "admin.subscriptionDate": "تاريخ الانتهاء",
    "admin.percentActive": "نشط",

    // Login extra
    "login.username": "اسم المستخدم",
    "login.usernamePlaceholder": "أدخل اسم المستخدم",
    "login.noAccount": "ليس لديك حساب؟",
    "login.registerLink": "سجل الآن",

    // Register
    "register.title": "إنشاء حساب جديد",
    "register.subtitle": "سجل في ديبت فلو",
    "register.iama": "نوع الحساب",
    "register.sendOtp": "إرسال رمز التحقق",
    "register.otpSent": "تم إرسال رمز التحقق عبر واتساب",
    "register.otpSentTo": "تم إرسال رمز التحقق إلى",
    "register.verifyOtp": "تحقق من الرمز",
    "register.otpVerified": "تم التحقق بنجاح",
    "register.invalidOtp": "رمز التحقق غير صحيح أو منتهي الصلاحية",
    "register.changePhone": "تغيير رقم الهاتف",
    "register.resendOtp": "إعادة إرسال الرمز",
    "register.createAccount": "إنشاء الحساب",
    "register.success": "تم إنشاء الحساب بنجاح",
    "register.roleAdded": "تم إضافة الدور بنجاح، يمكنك الآن تسجيل الدخول بهذا الدور",
    "register.hasAccount": "لديك حساب بالفعل؟",
    "register.userExists": "هذا الرقم مسجل مسبقاً بنفس الدور",
    "register.businessName": "اسم المنشأة",
    "register.businessNamePlaceholder": "أدخل اسم المنشأة",
    "register.ownerName": "اسم صاحب المنشأة",
    "register.ownerNamePlaceholder": "أدخل اسم صاحب المنشأة",
    "register.businessAddress": "عنوان المنشأة",
    "register.businessAddressPlaceholder": "أدخل عنوان المنشأة",

    // Employees extra
    "employees.created": "تم إضافة الموظف بنجاح",
    "employees.updated": "تم تحديث بيانات الموظف",
    "employees.deleted": "تم حذف الموظف",
    "employees.edit": "تعديل الموظف",
    "employees.passwordOptional": "اختياري",

    // Home
    "home.selectRole": "كيف تريد الدخول؟",
    "home.contactUs": "تواصل معنا",

    // Contact
    "contact.title": "تواصل معنا",
    "contact.subtitle": "نحن هنا لمساعدتك. اختر طريقة التواصل المناسبة لك.",
    "contact.whatsapp": "واتساب",
    "contact.phone": "الهاتف",
    "contact.email": "البريد الإلكتروني",
    "contact.address": "العنوان",
    "contact.addressValue": "صنعاء، اليمن",
    "contact.hours": "ساعات العمل",
    "contact.hoursValue": "السبت - الخميس، 8 صباحاً - 6 مساءً",

    // Forgot password
    "login.forgotPassword": "هل نسيت كلمة المرور؟",
    "forgot.title": "استعادة كلمة المرور",
    "forgot.subtitle": "أدخل رقم هاتفك لإرسال رمز التحقق عبر واتساب",
    "forgot.newPassword": "كلمة المرور الجديدة",
    "forgot.confirmPassword": "تأكيد كلمة المرور",
    "forgot.passwordMismatch": "كلمتا المرور غير متطابقتين",
    "forgot.resetButton": "تغيير كلمة المرور",
    "forgot.success": "تم تغيير كلمة المرور بنجاح",

    // Admin extra
    "admin.ownersSubtitle": "إدارة أصحاب المنشآت",
    "admin.searchOwners": "بحث بالاسم أو الهاتف...",
    "admin.subscriptionsSub": "إدارة اشتراكات المنشآت",
    "admin.all": "الكل",
    "admin.month": "شهر",
    "admin.months": "أشهر",
    "admin.plansTitle": "خطط الاشتراك",
    "admin.plansSub": "عرض خطط الاشتراك المتاحة",

    // Settings
    "settings.title": "الإعدادات",
    "settings.subtitle": "إدارة إعدادات حسابك",
    "settings.businessInfo": "معلومات المنشأة",
    "settings.saved": "تم حفظ التغييرات",
    "settings.language": "اللغة",
    "settings.languageDesc": "تغيير لغة العرض",
    "settings.security": "الأمان",
    "settings.securityDesc": "إدارة إعدادات الأمان",
    "settings.notifications": "الإشعارات",
    "settings.notificationsDesc": "إدارة إعدادات الإشعارات",
    "settings.data": "البيانات",
    "settings.dataDesc": "تصدير وإدارة البيانات",
    "settings.adminInfo": "معلومات المدير",

    // Customer extra
    "customer.noBusinesses": "لا توجد حسابات في أي منشأة",

    // Orders
    "nav.orders": "الطلبات",
    "orders.title": "الطلبات",
    "orders.subtitle": "أرسل طلبات تسجيل دين أو سداد",
    "orders.ownerSubtitle": "إدارة طلبات الزبائن",
    "orders.requestDebt": "طلب تسجيل دين",
    "orders.requestPayment": "طلب تسديد دين",
    "orders.debtRequest": "طلب تسجيل دين",
    "orders.paymentRequest": "طلب سداد",
    "orders.myOrders": "طلباتي",
    "orders.pending": "قيد الانتظار",
    "orders.approved": "مقبول",
    "orders.rejected": "مرفوض",
    "orders.pendingCount": "طلب معلق",
    "orders.selectBusiness": "اختر المنشأة",
    "orders.paymentMethod": "طريقة الدفع",
    "orders.cash": "نقد",
    "orders.wallets": "محافظ إلكترونية",
    "orders.banks": "بنوك",
    "orders.transferTo": "حوّل إلى",
    "orders.phoneNumber": "رقم الهاتف",
    "orders.accountName": "اسم الحساب",
    "orders.accountNamePlaceholder": "أدخل اسم الحساب",
    "orders.pointNumber": "رقم النقطة",
    "orders.pointNumberPlaceholder": "أدخل رقم النقطة",
    "orders.accountNumber": "رقم الحساب",
    "orders.accountNumberPlaceholder": "أدخل رقم الحساب",
    "orders.transactionNumber": "رقم العملية",
    "orders.transactionNumberPlaceholder": "أدخل رقم العملية",
    "orders.senderName": "اسم المرسل",
    "orders.senderNamePlaceholder": "أدخل اسم المرسل",
    "orders.bankPoint": "نقطة حاسب",
    "orders.bankTransfer": "حوالة",
    "orders.send": "إرسال الطلب",
    "orders.sent": "تم إرسال الطلب بنجاح",
    "orders.fillRequired": "يرجى ملء جميع الحقول المطلوبة",
    "orders.selectPaymentMethod": "يرجى اختيار طريقة الدفع",
    "orders.noOrders": "لا توجد طلبات",
    "orders.noPaymentMethods": "لم يتم إعداد طرق الدفع",
    "orders.approve": "قبول",
    "orders.reject": "رفض",
    "orders.rejectOrder": "رفض الطلب",
    "orders.rejectionReason": "سبب الرفض",
    "orders.rejectionReasonPlaceholder": "أدخل سبب الرفض...",
    "orders.orderApproved": "تم قبول الطلب بنجاح",
    "orders.orderRejected": "تم رفض الطلب",

    // Settings - payment methods
    "settings.paymentMethods": "طرق الدفع",
    "settings.addPaymentMethod": "إضافة طريقة دفع",
    "settings.paymentMethodAdded": "تم إضافة طريقة الدفع",
    "settings.paymentMethodDeleted": "تم حذف طريقة الدفع",
    "settings.noPaymentMethods": "لم تتم إضافة طرق دفع بعد",
    "settings.methodType": "النوع",
    "settings.provider": "المزود",
    "settings.selectProvider": "اختر المزود",

    // Reports
    "reports.title": "التقارير",
    "reports.subtitle": "تقارير تفصيلية عن المنشأة",
    "reports.downloadPdf": "تحميل PDF",
    "reports.filters": "تصفية التقرير",
    "reports.dateFrom": "من تاريخ",
    "reports.dateTo": "إلى تاريخ",
    "reports.customer": "الزبون",
    "reports.customerBreakdown": "تفصيل حسب الزبائن",
    "reports.debtsLabel": "ديون",
    "reports.paymentsLabel": "مدفوعات",
    "reports.ordersStats": "إحصائيات الطلبات",

    // Subscription banner
    "sub.trialBanner": "فترة تجريبية — متبقي {days} يوم",
    "sub.trialWarning": "تبقى {days} أيام فقط! الرجاء الاشتراك لتفعيل حسابك قبل انتهاء المدة التجريبية.",
    "sub.expiredBanner": "انتهت الفترة التجريبية. الرجاء الاشتراك لتفعيل حسابك. بياناتك محفوظة ولا تقلق.",
    "sub.activeBanner": "الاشتراك نشط — متبقي {days} يوم",
    "sub.goToSub": "الاشتراك الآن",
  },
  en: {
    // Common
    "app.name": "DebtFlow",
    "app.tagline": "Smart Debt Management for Modern Businesses",
    "app.tagline.sub": "Track customer debts, record payments, and manage your business finances with ease.",
    "app.copyright": "© 2026 DebtFlow. All rights reserved.",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.search": "Search",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.back": "Back",
    "common.view": "View",
    "common.loading": "Loading...",
    "common.noData": "No data",
    "common.yer": "YER",
    "common.settled": "Settled",
    "common.success": "Success",
    "common.error": "Error",
    "common.errorMsg": "An error occurred, please try again",

    // Forms
    "form.name": "Name",
    "form.namePlaceholder": "Enter name",
    "form.phone": "Phone Number",
    "form.address": "Address",
    "form.addressPlaceholder": "Enter address",
    "form.selectCustomer": "Select customer",
    "form.selectDebt": "Select debt",
    "form.descriptionPlaceholder": "Enter description",

    // CRUD messages
    "customers.created": "Customer added successfully",
    "customers.createdLinked": "Customer added and automatically linked to their registered account",
    "customers.updated": "Customer updated successfully",
    "customers.deleted": "Customer deleted",
    "customers.cannotDeleteHasDebt": "Cannot delete customer with outstanding debt balance",
    "customers.deactivated": "Customer deactivated",
    "customers.activated": "Customer activated",
    "customers.deactivate": "Deactivate",
    "customers.activate": "Activate",
    "customers.inactive": "Inactive",
    "customers.edit": "Edit Customer",
    "customers.debtLimit": "Debt Limit",
    "customers.debtLimitOptional": "Debt Limit (Optional)",
    "customers.debtLimitPlaceholder": "e.g. 50000 (leave empty for no limit)",
    "debts.created": "Debt recorded successfully",
    "debts.deleted": "Debt deleted",
    "debts.debtLimitExceeded": "This debt exceeds the customer's credit limit",
    "customers.debtLimitNote": "⚠️ Debt limit cannot be changed until 1 month after the first transaction",
    "customers.debtLimitLocked": "Cannot change debt limit now. Must wait 1 month after first transaction",
    "orders.debtLimitExceeded": "Order auto-rejected because amount exceeds the customer's debt limit",
    "orders.orderAlreadyProcessed": "This order has already been processed",
    "customer.debtLimitInfo": "Your debt limit",
    "debts.attachImage": "Attach Image (optional)",
    "debts.takePhoto": "Take photo or choose file",
    "payments.created": "Payment recorded successfully",
    "admin.activated": "Subscription activated successfully",

    // Roles
    "role.super_admin": "Super Admin",
    "role.owner": "Business Owner",
    "role.employee": "Employee",
    "role.customer": "Customer",

    // Login
    "login.welcome": "Welcome back",
    "login.subtitle": "Sign in to your account",
    "login.iama": "I am a",
    "login.phone": "Phone Number",
    "login.phonePlaceholder": "+967 7XX XXX XXX",
    "login.signin": "Sign In",
    "login.admin": "Admin?",
    "login.adminLink": "Sign in here",
    "login.notAdmin": "Not an admin?",
    "login.regularLink": "Go to regular login",
    "login.adminPortal": "Admin Portal",
    "login.adminSubtitle": "DebtFlow System Administration",
    "login.adminPhone": "Admin Phone",
    "login.signinAdmin": "Sign In as Admin",
    "login.email": "Email Address",
    "login.emailPlaceholder": "admin@example.com",
    "login.password": "Password",
    "login.error": "Error",
    "login.invalidCredentials": "Invalid login credentials",
    "login.noRole": "You don't have an account with this role. Please register first",
    "login.owner.title": "Business Owner",
    "login.owner.desc": "Manage your business debts",
    "login.employee.title": "Employee",
    "login.employee.desc": "Access your employer's account",
    "login.customer.title": "Customer",
    "login.customer.desc": "View your debts & payments",

    // Nav
    "nav.dashboard": "Dashboard",
    "nav.customers": "Customers",
    "nav.debts": "Debts",
    "nav.payments": "Payments",
    "nav.employees": "Employees",
    "nav.subscription": "Subscription",
    "nav.businesses": "My Businesses",
    "nav.owners": "Owners",
    "nav.subscriptions": "Subscriptions",
    "nav.plans": "Plans",
    "nav.trials": "Trials",
    "nav.settings": "Settings",
    "nav.ads": "Ads",
    "nav.reports": "Reports",
    "nav.branding": "Branding",
    "nav.contact": "Contact",
    "nav.paymentAccounts": "Payment Accounts",
    "nav.texts": "Texts",

    // Owner Dashboard
    "owner.welcome": "Welcome back,",
    "owner.welcomeSub": "Here's what's happening with",
    "owner.welcomeToday": "today.",
    "owner.totalCustomers": "Total Customers",
    "owner.totalDebts": "Total Debts",
    "owner.totalPayments": "Total Payments",
    "owner.balance": "Balance",
    "owner.recentActivity": "Recent Activity",
    "owner.activeDebts": "active debts",
    "owner.thisMonth": "This month",
    "owner.outstanding": "Outstanding",
    "owner.thisWeek": "this week",

    // Activity
    "activity.newDebt": "New debt of {amount} YER for {name}",
    "activity.payment": "Payment of {amount} YER from {name}",
    "activity.minAgo": "{n} min ago",
    "activity.hourAgo": "{n} hour ago",
    "activity.hoursAgo": "{n} hours ago",

    // Customers
    "customers.title": "Customers",
    "customers.total": "total customers",
    "customers.add": "Add Customer",
    "customers.searchPlaceholder": "Search by name or phone...",
    "customers.balance": "Balance",
    "customers.debtsCount": "Debts",
    "customers.noResults": "No customers found",
    "customers.trySearch": "Try a different search term",

    // Debts
    "debts.title": "Debts",
    "debts.subtitle": "Manage customer debts",
    "debts.new": "New Debt",
    "debts.customer": "Customer",
    "debts.amount": "Amount",
    "debts.description": "Description",
    "debts.date": "Date",
    "debts.operationNumber": "Op #",
    "debts.status": "Status",
    "debts.unpaid": "Unpaid",
    "debts.partial": "Partial",
    "debts.paid": "Paid",
    "debts.noDebts": "No debts yet",
    "debts.viewImage": "View Image",
    "debts.attachedImage": "Attached image",

    // Payments
    "payments.title": "Payments",
    "payments.subtitle": "Record and track payments",
    "payments.record": "Record Payment",
    "payments.noPayments": "No payments yet",
    "payments.exceedsBalance": "Amount exceeds the customer's outstanding balance",
    "payments.excessReturned": "Only the outstanding amount will be recorded and the excess amount returned:",
    "payments.noOutstandingDebts": "No outstanding debts for this customer",

    // Employees
    "employees.title": "Employees",
    "employees.subtitle": "Manage your team",
    "employees.add": "Add Employee",
    "employees.noEmployees": "No employees yet",
    "employees.active": "Active",
    "employees.inactive": "Inactive",

    // Subscription
    "sub.title": "Subscription",
    "sub.subtitle": "Manage your subscription plan",
    "sub.trialDays": "Free Trial — {days} days remaining",
    "sub.active": "Subscription Active",
    "sub.expired": "Subscription Expired",
    "sub.expiredMsg": "Please transfer payment and contact admin to activate your account.",
    "sub.plans": "Subscription Plans",
    "sub.monthly": "Monthly",
    "sub.quarterly": "Quarterly",
    "sub.yearly": "Yearly",
    "sub.days": "days",
    "sub.mostPopular": "Most Popular",
    "sub.unlimitedCustomers": "Unlimited customers",
    "sub.unlimitedDebts": "Unlimited debts",
    "sub.pdfReports": "PDF reports",
    "sub.notifications": "Notifications",
    "sub.everythingMonthly": "Everything in Monthly",
    "sub.prioritySupport": "Priority support",
    "sub.employeeAccounts": "Employee accounts",
    "sub.advancedReports": "Advanced reports",
    "sub.everythingQuarterly": "Everything in Quarterly",
    "sub.dedicatedSupport": "Dedicated support",
    "sub.customBranding": "Custom branding",
    "sub.apiAccess": "API access",
    "sub.bankAccounts": "Bank Accounts",
    "sub.walletAccounts": "Wallet Accounts",
    "sub.accountName": "Account Name",
    "sub.bankName": "Bank Name",
    "sub.accountNumber": "Account Number",
    "sub.walletPhone": "Phone Number",
    "sub.instructions": "Instructions",
    "sub.contactAdmin": "Contact Admin via WhatsApp",
    "sub.whatsappMsg": "Hello, I have transferred the subscription payment and want to activate my account. My phone number is: ",

    // Customer
    "customer.businesses": "My Businesses",
    "customer.businessesSub": "View your accounts across different businesses",
    "customer.accountDetails": "Account details",
    "customer.totalDebts": "Total Debts",
    "customer.totalPayments": "Total Payments",

    // Admin
    "admin.overview": "System Overview",
    "admin.subtitle": "DebtFlow platform administration",
    "admin.totalOwners": "Total Owners",
    "admin.activeSubscriptions": "Active Subscriptions",
    "admin.totalCustomers": "Total Customers",
    "admin.monthlyRevenue": "Monthly Revenue",
    "admin.recentOwners": "Recent Business Owners",
    "admin.owner": "Owner",
    "admin.business": "Business",
    "admin.phone": "Phone",
    "admin.status": "Status",
    "admin.action": "Action",
    "admin.activate": "Activate",
    "admin.trial": "Trial",
    "admin.active": "Active",
    "admin.expired": "Expired",
    "admin.thisMonth": "this month",
    "admin.subscriptionDate": "Expiry Date",
    "admin.percentActive": "active",

    // Login extra
    "login.username": "Username",
    "login.usernamePlaceholder": "Enter username",
    "login.noAccount": "Don't have an account?",
    "login.registerLink": "Register now",

    // Register
    "register.title": "Create Account",
    "register.subtitle": "Sign up for DebtFlow",
    "register.iama": "Account Type",
    "register.sendOtp": "Send Verification Code",
    "register.otpSent": "Verification code sent via WhatsApp",
    "register.otpSentTo": "Verification code sent to",
    "register.verifyOtp": "Verify Code",
    "register.otpVerified": "Verified successfully",
    "register.invalidOtp": "Invalid or expired verification code",
    "register.changePhone": "Change phone number",
    "register.resendOtp": "Resend Code",
    "register.createAccount": "Create Account",
    "register.success": "Account created successfully",
    "register.roleAdded": "Role added successfully, you can now login with this role",
    "register.hasAccount": "Already have an account?",
    "register.userExists": "This phone is already registered with this role",
    "register.businessName": "Business Name",
    "register.businessNamePlaceholder": "Enter business name",
    "register.ownerName": "Owner Name",
    "register.ownerNamePlaceholder": "Enter owner name",
    "register.businessAddress": "Business Address",
    "register.businessAddressPlaceholder": "Enter business address",

    // Employees extra
    "employees.created": "Employee added successfully",
    "employees.updated": "Employee updated successfully",
    "employees.deleted": "Employee deleted",
    "employees.edit": "Edit Employee",
    "employees.passwordOptional": "optional",

    // Home
    "home.selectRole": "How do you want to sign in?",
    "home.contactUs": "Contact Us",

    // Contact
    "contact.title": "Contact Us",
    "contact.subtitle": "We're here to help. Choose your preferred way to reach us.",
    "contact.whatsapp": "WhatsApp",
    "contact.phone": "Phone",
    "contact.email": "Email",
    "contact.address": "Address",
    "contact.addressValue": "Sana'a, Yemen",
    "contact.hours": "Working Hours",
    "contact.hoursValue": "Saturday - Thursday, 8 AM - 6 PM",

    // Forgot password
    "login.forgotPassword": "Forgot your password?",
    "forgot.title": "Reset Password",
    "forgot.subtitle": "Enter your phone number to receive a verification code via WhatsApp",
    "forgot.newPassword": "New Password",
    "forgot.confirmPassword": "Confirm Password",
    "forgot.passwordMismatch": "Passwords do not match",
    "forgot.resetButton": "Reset Password",
    "forgot.success": "Password reset successfully",

    // Admin extra
    "admin.ownersSubtitle": "Manage business owners",
    "admin.searchOwners": "Search by name or phone...",
    "admin.subscriptionsSub": "Manage owner subscriptions",
    "admin.all": "All",
    "admin.month": "month",
    "admin.months": "months",
    "admin.plansTitle": "Subscription Plans",
    "admin.plansSub": "View available subscription plans",

    // Settings
    "settings.title": "Settings",
    "settings.subtitle": "Manage your account settings",
    "settings.businessInfo": "Business Information",
    "settings.saved": "Changes saved successfully",
    "settings.language": "Language",
    "settings.languageDesc": "Change display language",
    "settings.security": "Security",
    "settings.securityDesc": "Manage security settings",
    "settings.notifications": "Notifications",
    "settings.notificationsDesc": "Manage notification settings",
    "settings.data": "Data",
    "settings.dataDesc": "Export and manage data",
    "settings.adminInfo": "Admin Information",

    // Customer extra
    "customer.noBusinesses": "No business accounts found",

    // Orders
    "nav.orders": "Orders",
    "orders.title": "Orders",
    "orders.subtitle": "Submit debt or payment requests",
    "orders.ownerSubtitle": "Manage customer requests",
    "orders.requestDebt": "Request Debt",
    "orders.requestPayment": "Request Payment",
    "orders.debtRequest": "Debt Request",
    "orders.paymentRequest": "Payment Request",
    "orders.myOrders": "My Orders",
    "orders.pending": "Pending",
    "orders.approved": "Approved",
    "orders.rejected": "Rejected",
    "orders.pendingCount": "pending",
    "orders.selectBusiness": "Select Business",
    "orders.paymentMethod": "Payment Method",
    "orders.cash": "Cash",
    "orders.wallets": "E-Wallets",
    "orders.banks": "Banks",
    "orders.transferTo": "Transfer to",
    "orders.phoneNumber": "Phone Number",
    "orders.accountName": "Account Name",
    "orders.accountNamePlaceholder": "Enter account name",
    "orders.pointNumber": "Point Number",
    "orders.pointNumberPlaceholder": "Enter point number",
    "orders.accountNumber": "Account Number",
    "orders.accountNumberPlaceholder": "Enter account number",
    "orders.transactionNumber": "Transaction Number",
    "orders.transactionNumberPlaceholder": "Enter transaction number",
    "orders.senderName": "Sender Name",
    "orders.senderNamePlaceholder": "Enter sender name",
    "orders.bankPoint": "Bank Point",
    "orders.bankTransfer": "Transfer",
    "orders.send": "Send Request",
    "orders.sent": "Request sent successfully",
    "orders.fillRequired": "Please fill all required fields",
    "orders.selectPaymentMethod": "Please select a payment method",
    "orders.noOrders": "No orders yet",
    "orders.noPaymentMethods": "No payment methods configured",
    "orders.approve": "Approve",
    "orders.reject": "Reject",
    "orders.rejectOrder": "Reject Order",
    "orders.rejectionReason": "Rejection Reason",
    "orders.rejectionReasonPlaceholder": "Enter rejection reason...",
    "orders.orderApproved": "Order approved successfully",
    "orders.orderRejected": "Order rejected",

    // Settings - payment methods
    "settings.paymentMethods": "Payment Methods",
    "settings.addPaymentMethod": "Add Payment Method",
    "settings.paymentMethodAdded": "Payment method added",
    "settings.paymentMethodDeleted": "Payment method deleted",
    "settings.noPaymentMethods": "No payment methods added yet",
    "settings.methodType": "Type",
    "settings.provider": "Provider",
    "settings.selectProvider": "Select provider",

    // Reports
    "reports.title": "Reports",
    "reports.subtitle": "Detailed business reports",
    "reports.downloadPdf": "Download PDF",
    "reports.filters": "Filter Report",
    "reports.dateFrom": "From date",
    "reports.dateTo": "To date",
    "reports.customer": "Customer",
    "reports.customerBreakdown": "Customer Breakdown",
    "reports.debtsLabel": "Debts",
    "reports.paymentsLabel": "Payments",
    "reports.ordersStats": "Orders Statistics",

    // Subscription banner
    "sub.trialBanner": "Free Trial — {days} days remaining",
    "sub.trialWarning": "Only {days} days left! Please subscribe to keep your account active.",
    "sub.expiredBanner": "Your trial has expired. Please subscribe to reactivate your account. Your data is safe.",
    "sub.activeBanner": "Subscription Active — {days} days remaining",
    "sub.goToSub": "Subscribe Now",
  },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("ar");
  const { data: appSettings } = useAppSettings();

  const textOverrides = React.useMemo(() => {
    if (!appSettings?.["text_overrides"]) return {};
    try { return JSON.parse(appSettings["text_overrides"]); } catch { return {}; }
  }, [appSettings]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    document.documentElement.dir = l === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = l;
  }, []);

  useEffect(() => {
    document.documentElement.dir = "rtl";
    document.documentElement.lang = "ar";
  }, []);

  const t = useCallback((key: string) => {
    // Check for admin text overrides first
    const override = textOverrides[key];
    if (override) {
      const val = lang === "ar" ? override.ar : override.en;
      if (val) return val;
    }
    return translations[lang][key] || key;
  }, [lang, textOverrides]);

  const dir = lang === "ar" ? "rtl" : "ltr";
  const isRTL = lang === "ar";

  const formatCurrency = useCallback((amount: number) => {
    const formatted = amount.toLocaleString();
    return lang === "ar" ? `${formatted} ر.ي` : `${formatted} YER`;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir, isRTL, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
