import * as XLSX from "xlsx";

/**
 * وظيفة لتحويل البيانات إلى ملف إكسل بصفحات متعددة
 * @param ownerData البيانات التي سيتم تصديرها
 * @param businessName اسم المنشأة لتسمية الملف
 */
export const exportOwnerDataToExcel = (ownerData: any, businessName: string) => {
  if (!ownerData) return;
  const { customers = [], transactions = [], profile = {} } = ownerData;

  // 1. تجهيز صفحة معلومات المنشأة
  const profileSheet = [
    { "المعلومة": "اسم المنشأة", "القيمة": profile?.business_name || businessName || "-" },
    { "المعلومة": "اسم المالك", "القيمة": profile?.name || "-" },
    { "المعلومة": "الهاتف", "القيمة": profile?.phone || "-" },
    { "المعلومة": "حالة الاشتراك", "القيمة": profile?.subscription_status || "-" },
    { "المعلومة": "تاريخ التصدير", "القيمة": new Date().toLocaleString("ar-YE") },
  ];

  // 2. تجهيز صفحة الزبائن (مع البيانات المالية)
  const customersSheet = customers.map((c: any) => ({
    "اسم الزبون": c?.name || "-",
    "رقم الهاتف": c?.phone || "-",
    "العنوان": c?.address || "-",
    "سقف الديون": c?.debt_limit || 0,
    "إجمالي الديون": c?.total_debts || 0,
    "إجمالي السداد": c?.total_payments || 0,
    "المتبقي": c?.balance || 0,
    "تاريخ الإضافة": c?.created_at ? new Date(c.created_at).toLocaleDateString("ar-YE") : "-",
  }));

  // 3. تجهيز صفحة العمليات (ديون وسدادات وتفاصيل)
  const transactionsSheet = transactions.map((t: any) => ({
    "اسم الزبون": t?.customer_name || "-",
    "نوع العملية": t?.type === "debt" ? "دين" : "سداد",
    "المبلغ": t?.amount || 0,
    "التاريخ": t?.created_at ? new Date(t.created_at).toLocaleString("ar-YE") : "-",
    "التفاصيل": t?.description || t?.note || "-",
  }));

  // إنشاء كتاب عمل جديد (Workbook)
  const wb = XLSX.utils.book_new();

  // تحويل المصفوفات إلى صفحات (Worksheets)
  const wsProfile = XLSX.utils.json_to_sheet(profileSheet);
  const wsCustomers = XLSX.utils.json_to_sheet(customersSheet);
  const wsTransactions = XLSX.utils.json_to_sheet(transactionsSheet);

  // تفعيل خاصية اليمين لليسار (RTL) لكل الصفحات
  wsProfile["!views"] = [{ RTL: true }];
  wsCustomers["!views"] = [{ RTL: true }];
  wsTransactions["!views"] = [{ RTL: true }];

  // تعيين عرض الأعمدة ليكون الملف مرتباً
  const profileCols = [{ wch: 20 }, { wch: 40 }];
  const customerCols = [{ wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 20 }];
  const txCols = [{ wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 25 }, { wch: 40 }];
  
  wsProfile["!cols"] = profileCols;
  wsCustomers["!cols"] = customerCols;
  wsTransactions["!cols"] = txCols;

  // إضافة الصفحات لكتاب العمل
  XLSX.utils.book_append_sheet(wb, wsProfile, "معلومات المنشأة");
  XLSX.utils.book_append_sheet(wb, wsCustomers, "الزبائن");
  XLSX.utils.book_append_sheet(wb, wsTransactions, "العمليات");

  // تصدير وتحميل الملف
  const safeBusinessName = (businessName || "Business").replace(/\s+/g, "_");
  const fileName = `نسخة_احتياطية_${safeBusinessName}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

/**
 * وظيفة لتحويل البيانات إلى ملف CSV متوافق مع الإكسل العربي
 */
export const exportOwnerDataToCSV = (ownerData: any, businessName: string) => {
  if (!ownerData || !ownerData.transactions) return;
  const { transactions = [] } = ownerData;
  
  // إضافة سطر التعريف لتسهيل فتحه في الإكسل بالأعمدة الصحيحة
  const header = "sep=;";
  const columns = ["اسم الزبون", "نوع العملية", "المبلغ", "التاريخ", "ملاحظات"].join(";");
  
  const rows = transactions.map((t: any) => [
    `"${t?.customer_name || "-"}"`,
    t?.type === "debt" ? "دين" : "سداد",
    t?.amount || 0,
    `"${t?.created_at ? new Date(t.created_at).toLocaleString("ar-YE") : "-"}"`,
    `"${(t?.note || "-").replace(/"/g, '""')}"`
  ].join(";"));

  const csvContent = [header, columns, ...rows].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `Backup_${(businessName || "Business").replace(/\s+/g, "_")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
