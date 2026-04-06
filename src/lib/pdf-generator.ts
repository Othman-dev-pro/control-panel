import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportData {
  title: string;
  businessName: string;
  dateRange?: string;
  generatedAt: string;
  currency: string;
  lang: "ar" | "en";
}

interface CustomerReportRow {
  name: string;
  phone: string;
  totalDebts: number;
  totalPayments: number;
  balance: number;
}

interface TransactionRow {
  date: string;
  description: string;
  amount: number;
  type: "debt" | "payment";
}

interface SummaryStats {
  totalCustomers?: number;
  totalDebts: number;
  totalPayments: number;
  balance: number;
  debtCount?: number;
  paymentCount?: number;
}

interface DetailedCustomer {
  name: string;
  phone: string;
  totalDebts: number;
  totalPayments: number;
  balance: number;
  debts: TransactionRow[];
  payments: TransactionRow[];
}

function formatNum(n: number): string {
  return n.toLocaleString();
}

// Load and register Arabic font
async function loadArabicFont(doc: jsPDF): Promise<void> {
  try {
    const response = await fetch("/fonts/Amiri-Regular.ttf");
    const buffer = await response.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    doc.addFileToVFS("Amiri-Regular.ttf", base64);
    doc.addFont("Amiri-Regular.ttf", "Amiri", "normal");

    const boldResponse = await fetch("/fonts/Amiri-Bold.ttf");
    const boldBuffer = await boldResponse.arrayBuffer();
    const boldBase64 = arrayBufferToBase64(boldBuffer);
    doc.addFileToVFS("Amiri-Bold.ttf", boldBase64);
    doc.addFont("Amiri-Bold.ttf", "Amiri", "bold");
  } catch (e) {
    console.warn("Could not load Arabic font, falling back to default", e);
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function setArabicFont(doc: jsPDF, isRTL: boolean, style: "normal" | "bold" = "normal") {
  if (isRTL) {
    try {
      doc.setFont("Amiri", style);
    } catch {
      // fallback
    }
  }
}

function addHeader(doc: jsPDF, data: ReportData) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const isRTL = data.lang === "ar";

  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  setArabicFont(doc, isRTL, "bold");
  doc.text(data.title, pageWidth / 2, 12, { align: "center" });

  doc.setFontSize(10);
  setArabicFont(doc, isRTL, "normal");
  doc.text(data.businessName, pageWidth / 2, 19, { align: "center" });

  if (data.dateRange) {
    doc.setFontSize(8);
    doc.text(data.dateRange, pageWidth / 2, 25, { align: "center" });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  setArabicFont(doc, isRTL, "normal");
  doc.text(data.generatedAt, pageWidth / 2, 33, { align: "center" });
  doc.setTextColor(0, 0, 0);

  return 38;
}

function addSummaryBox(doc: jsPDF, startY: number, stats: SummaryStats, data: ReportData): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const isRTL = data.lang === "ar";
  const margin = 14;
  const boxWidth = (pageWidth - margin * 2 - 8) / 3;

  const items = [
    {
      label: isRTL ? "إجمالي الديون" : "Total Debts",
      value: `${formatNum(stats.totalDebts)} ${data.currency}`,
      color: [220, 38, 38] as [number, number, number],
    },
    {
      label: isRTL ? "إجمالي المدفوعات" : "Total Payments",
      value: `${formatNum(stats.totalPayments)} ${data.currency}`,
      color: [16, 185, 129] as [number, number, number],
    },
    {
      label: isRTL ? "الرصيد المتبقي" : "Balance",
      value: `${formatNum(stats.balance)} ${data.currency}`,
      color: stats.balance > 0 ? [220, 38, 38] as [number, number, number] : [16, 185, 129] as [number, number, number],
    },
  ];

  items.forEach((item, i) => {
    const x = margin + i * (boxWidth + 4);
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(x, startY, boxWidth, 18, 2, 2, "F");

    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    setArabicFont(doc, isRTL, "normal");
    doc.text(item.label, x + boxWidth / 2, startY + 6, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(...item.color);
    setArabicFont(doc, isRTL, "bold");
    doc.text(item.value, x + boxWidth / 2, startY + 14, { align: "center" });
  });

  doc.setTextColor(0, 0, 0);
  return startY + 24;
}

function getTableFont(isRTL: boolean) {
  return isRTL ? "Amiri" : undefined;
}

function addFooter(doc: jsPDF, isRTL: boolean) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    setArabicFont(doc, isRTL, "normal");
    const footerText = isRTL ? `صفحة ${i} من ${pageCount} — ديبت فلو` : `Page ${i} of ${pageCount} — DebtFlow`;
    doc.text(footerText, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
  }
}

export async function generateOwnerReport(
  data: ReportData,
  stats: SummaryStats,
  customers: CustomerReportRow[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isRTL = data.lang === "ar";

  if (isRTL) await loadArabicFont(doc);

  let startY = addHeader(doc, data);
  startY = addSummaryBox(doc, startY, stats, data);

  if (customers.length > 0) {
    const headers = isRTL
      ? [["الرصيد", "المدفوعات", "الديون", "الهاتف", "الزبون"]]
      : [["Customer", "Phone", "Debts", "Payments", "Balance"]];

    const body = customers.map((c) => {
      const row = [
        c.name,
        c.phone,
        `${formatNum(c.totalDebts)} ${data.currency}`,
        `${formatNum(c.totalPayments)} ${data.currency}`,
        `${formatNum(c.balance)} ${data.currency}`,
      ];
      return isRTL ? row.reverse() : row;
    });

    autoTable(doc, {
      startY,
      head: headers,
      body,
      theme: "grid",
      headStyles: {
        fillColor: [30, 58, 138],
        textColor: [255, 255, 255],
        fontSize: 8,
        halign: isRTL ? "right" : "left",
        font: getTableFont(isRTL),
      },
      bodyStyles: {
        fontSize: 8,
        halign: isRTL ? "right" : "left",
        font: getTableFont(isRTL),
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc, isRTL);
  doc.save(`${data.title.replace(/\s/g, "_")}.pdf`);
}

export async function generateDetailedCustomerReport(
  data: ReportData,
  stats: SummaryStats,
  customers: DetailedCustomer[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isRTL = data.lang === "ar";

  if (isRTL) await loadArabicFont(doc);

  let startY = addHeader(doc, data);
  startY = addSummaryBox(doc, startY, stats, data);

  // Per-customer details
  for (const customer of customers) {
    // Check if we need a new page
    if (startY > doc.internal.pageSize.getHeight() - 50) {
      doc.addPage();
      startY = 15;
    }

    // Customer header
    doc.setFillColor(240, 242, 245);
    doc.roundedRect(14, startY, doc.internal.pageSize.getWidth() - 28, 12, 2, 2, "F");
    doc.setFontSize(10);
    doc.setTextColor(30, 58, 138);
    setArabicFont(doc, isRTL, "bold");
    const customerTitle = `${customer.name} — ${customer.phone}`;
    const balanceText = `${isRTL ? "الرصيد:" : "Balance:"} ${formatNum(customer.balance)} ${data.currency}`;
    doc.text(customerTitle, isRTL ? doc.internal.pageSize.getWidth() - 18 : 18, startY + 8, { align: isRTL ? "right" : "left" });
    doc.setFontSize(8);
    doc.setTextColor(customer.balance > 0 ? 220 : 16, customer.balance > 0 ? 38 : 185, customer.balance > 0 ? 38 : 129);
    doc.text(balanceText, isRTL ? 18 : doc.internal.pageSize.getWidth() - 18, startY + 8, { align: isRTL ? "left" : "right" });
    startY += 16;

    // Debts table
    if (customer.debts.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(220, 38, 38);
      setArabicFont(doc, isRTL, "bold");
      doc.text(isRTL ? "الديون" : "Debts", isRTL ? doc.internal.pageSize.getWidth() - 18 : 18, startY, { align: isRTL ? "right" : "left" });
      startY += 4;

      const dHeaders = isRTL
        ? [["المبلغ", "التفاصيل", "التاريخ"]]
        : [["Date", "Description", "Amount"]];

      const dBody = customer.debts.map((d) => {
        const row = [d.date, d.description || "-", `${formatNum(d.amount)} ${data.currency}`];
        return isRTL ? row.reverse() : row;
      });

      autoTable(doc, {
        startY,
        head: dHeaders,
        body: dBody,
        theme: "grid",
        headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 7, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
        bodyStyles: { fontSize: 7, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
        alternateRowStyles: { fillColor: [254, 242, 242] },
        margin: { left: 18, right: 18 },
      });
      startY = (doc as any).lastAutoTable.finalY + 4;
    }

    // Payments table
    if (customer.payments.length > 0) {
      if (startY > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        startY = 15;
      }

      doc.setFontSize(9);
      doc.setTextColor(16, 185, 129);
      setArabicFont(doc, isRTL, "bold");
      doc.text(isRTL ? "المدفوعات" : "Payments", isRTL ? doc.internal.pageSize.getWidth() - 18 : 18, startY, { align: isRTL ? "right" : "left" });
      startY += 4;

      const pHeaders = isRTL
        ? [["المبلغ", "التفاصيل", "التاريخ"]]
        : [["Date", "Description", "Amount"]];

      const pBody = customer.payments.map((p) => {
        const row = [p.date, p.description || "-", `${formatNum(p.amount)} ${data.currency}`];
        return isRTL ? row.reverse() : row;
      });

      autoTable(doc, {
        startY,
        head: pHeaders,
        body: pBody,
        theme: "grid",
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 7, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
        bodyStyles: { fontSize: 7, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
        alternateRowStyles: { fillColor: [236, 253, 245] },
        margin: { left: 18, right: 18 },
      });
      startY = (doc as any).lastAutoTable.finalY + 6;
    }

    startY += 2;
  }

  addFooter(doc, isRTL);
  doc.save(`${data.title.replace(/\s/g, "_")}.pdf`);
}

export async function generateCustomerReport(
  data: ReportData,
  stats: SummaryStats,
  debts: TransactionRow[],
  payments: TransactionRow[]
) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const isRTL = data.lang === "ar";

  if (isRTL) await loadArabicFont(doc);

  let startY = addHeader(doc, data);
  startY = addSummaryBox(doc, startY, stats, data);

  if (debts.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    setArabicFont(doc, isRTL, "bold");
    doc.text(isRTL ? "الديون" : "Debts", isRTL ? doc.internal.pageSize.getWidth() - 14 : 14, startY + 2, { align: isRTL ? "right" : "left" });
    startY += 6;

    const headers = isRTL
      ? [["المبلغ", "التفاصيل", "التاريخ"]]
      : [["Date", "Description", "Amount"]];

    const body = debts.map((d) => {
      const row = [d.date, d.description || "-", `${formatNum(d.amount)} ${data.currency}`];
      return isRTL ? row.reverse() : row;
    });

    autoTable(doc, {
      startY,
      head: headers,
      body,
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 8, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
      bodyStyles: { fontSize: 8, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
      alternateRowStyles: { fillColor: [254, 242, 242] },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as any).lastAutoTable.finalY + 8;
  }

  if (payments.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(16, 185, 129);
    setArabicFont(doc, isRTL, "bold");
    doc.text(isRTL ? "المدفوعات" : "Payments", isRTL ? doc.internal.pageSize.getWidth() - 14 : 14, startY + 2, { align: isRTL ? "right" : "left" });
    startY += 6;

    const headers = isRTL
      ? [["المبلغ", "التفاصيل", "التاريخ"]]
      : [["Date", "Description", "Amount"]];

    const body = payments.map((p) => {
      const row = [p.date, p.description || "-", `${formatNum(p.amount)} ${data.currency}`];
      return isRTL ? row.reverse() : row;
    });

    autoTable(doc, {
      startY,
      head: headers,
      body,
      theme: "grid",
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontSize: 8, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
      bodyStyles: { fontSize: 8, halign: isRTL ? "right" : "left", font: getTableFont(isRTL) },
      alternateRowStyles: { fillColor: [236, 253, 245] },
      margin: { left: 14, right: 14 },
    });
  }

  addFooter(doc, isRTL);
  doc.save(`${data.title.replace(/\s/g, "_")}.pdf`);
}
