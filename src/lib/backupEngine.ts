import { supabase } from "@/integrations/supabase/client";

/**
 * محرك النسخ الاحتياطي والاسترداد - نظام ديان النخبة
 * يقوم بتوليد ملفات SQL شاملة للهيكلية والبيانات
 */

const TABLES_ORDER = [
  "app_settings",
  "plans",
  "user_roles",
  "profiles",
  "customers",
  "debts",
  "payments",
  "notifications",
  "orders",
  "ads"
];

/**
 * توليد أوامر INSERT لجدول معين
 */
async function generateTableInserts(tableName: string): Promise<string> {
  const { data, error } = await supabase.from(tableName).select("*");
  if (error) {
    console.error(`Error fetching data for ${tableName}:`, error);
    return `-- Error fetching data for ${tableName}\n`;
  }

  if (!data || data.length === 0) return `-- No data for ${tableName}\n`;

  let sql = `-- Data for ${tableName}\n`;
  
  data.forEach((row: any) => {
    const columns = Object.keys(row).join(", ");
    const values = Object.values(row).map(val => {
      if (val === null) return "NULL";
      if (typeof val === "string") return `'${val.replace(/'/g, "''")}'`;
      if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
      return val;
    }).join(", ");
    
    sql += `INSERT INTO public.${tableName} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
  });

  return sql + "\n";
}

/**
 * تصدير البيانات بالكامل
 */
export async function exportAllDataSQL(): Promise<string> {
  let fullSql = "-- DEAN APP - FULL DATA BACKUP\n";
  fullSql += `-- Generated: ${new Date().toLocaleString()}\n\n`;
  fullSql += "SET statement_timeout = 0;\nSET client_encoding = 'UTF8';\n";
  fullSql += "SET standard_conforming_strings = on;\nSET check_function_bodies = false;\n";
  fullSql += "SET xmloption = content;\nSET client_min_messages = warning;\n\n";

  for (const table of TABLES_ORDER) {
    fullSql += await generateTableInserts(table);
  }

  return fullSql;
}

/**
 * تنفيذ مستند SQL للاسترداد
 * يتطلب وجود دالة exec_sql_admin في قاعدة البيانات
 */
export async function restoreFromSQL(sql: string): Promise<{ success: boolean; error?: string }> {
  try {
    // نقوم بتقسيم الملف إلى كتل لتجنب تجاوز حدود الحجم في RPC
    // أو تنفيذه ككتلة واحدة إذا كانت الدالة تدعم ذلك
    const { error } = await supabase.rpc("exec_sql_admin", { sql_param: sql });
    
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.error("Restore failed:", err);
    return { success: false, error: err.message };
  }
}

/**
 * تحميل الملف برمجياً
 */
export function downloadSQLFile(filename: string, content: string) {
  const element = document.createElement("a");
  const file = new Blob([content], { type: "text/plain" });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}
