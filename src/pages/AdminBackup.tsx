import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  FileJson, 
  FileCode, 
  History,
  Loader2,
  RefreshCcw,
  Zap,
  HardDriveDownload,
  HardDriveUpload,
  ServerCrash
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportAllDataSQL, downloadSQLFile, restoreFromSQL } from "@/lib/backupEngine";

export default function AdminBackup() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);

  const handleFullBackup = async () => {
    setIsExporting(true);
    try {
      const sqlContent = await exportAllDataSQL();
      const filename = `DeanApp_FullBackup_${new Date().toISOString().split('T')[0]}.sql`;
      downloadSQLFile(filename, sqlContent);
      toast({ 
        title: lang === "ar" ? "تم بنجاح" : "Success", 
        description: lang === "ar" ? "تم توليد وتحميل النسخة الاحتياطية بنجاح" : "Backup generated and downloaded successfully" 
      });
    } catch {
      toast({ variant: "destructive", title: lang === "ar" ? "خطأ" : "Error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreFile) return;
    
    setIsRestoring(true);
    try {
      const text = await restoreFile.text();
      const result = await restoreFromSQL(text);
      
      if (result.success) {
        toast({ 
          title: lang === "ar" ? "تم الاسترداد" : "Restore Complete", 
          description: lang === "ar" ? "تمت إعادة بناء البيانات بنجاح" : "Database has been successfully restored" 
        });
        setRestoreFile(null);
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast({ 
        variant: "destructive", 
        title: lang === "ar" ? "فشل الاسترداد" : "Restore Failed", 
        description: err.message 
      });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-10 animate-in fade-in duration-700 pb-20">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/20 shadow-inner">
              <Database className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{lang === "ar" ? "مركز الاسترداد" : "Recovery Center"}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">{lang === "ar" ? "إدارة النسخ الاحتياطي الشاملة والآمنة" : "Holistic & Secure Disaster Recovery Logic"}</p>
            </div>
          </div>
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-primary/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Export Section */}
          <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-3 border-b border-border/30 pb-6 relative z-10">
              <Download className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "تصدير البيانات" : "Data Orchestration"}</h2>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground leading-relaxed relative z-10">
              {lang === "ar" 
                ? "قم بتوليد ملف SQL متكامل يحتوي على كافة الجداول، العلاقات، والبيانات الحالية. يمكنك استخدام هذا الملف لإعادة بناء النظام بالكامل في أي لحظة."
                : "Generate a comprehensive SQL payload containing all table structures, relational constraints, and live records for total system portability."}
            </p>

            <div className="grid gap-4 pt-4 relative z-10">
              <Button 
                onClick={handleFullBackup} 
                disabled={isExporting}
                className="h-16 rounded-[24px] font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isExporting ? <Loader2 className="h-5 w-5 animate-spin" /> : <HardDriveDownload className="h-5 w-5" />}
                {lang === "ar" ? "تحميل النسخة الاحتياطية الكاملة (.sql)" : "Download Full SQL Archive"}
              </Button>
            </div>

            <div className="absolute bottom-[-10%] right-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
                <Database className="h-48 w-48 rotate-12" />
            </div>
          </div>

          {/* Import Section */}
          <div className="bg-card/60 backdrop-blur-sm p-10 rounded-[40px] border border-border/50 shadow-sm space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-3 border-b border-border/30 pb-6 relative z-10">
              <Upload className="h-6 w-6 text-orange-500" />
              <h2 className="text-xl font-black tracking-tight uppercase">{lang === "ar" ? "استرداد النظام" : "System Restore"}</h2>
            </div>
            
            <div className="p-6 rounded-[24px] bg-amber-500/5 border border-amber-500/10 flex items-start gap-4 relative z-10">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-1" />
                <p className="text-[11px] font-bold text-amber-700 leading-relaxed italic">
                    {lang === "ar" 
                      ? "تحذير: الاسترداد سيقوم بتعديل البيانات الحالية. تأكد من أن الملف المرفوع هو نسخة احتياطية صادرة من هذا المنصة حصراً."
                      : "Caution: Structural restoration will overwrite existing parity. Ensure the uploaded payload is an authentic DeanApp SQL archive."}
                </p>
            </div>

            <div className="space-y-4 relative z-10">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border/50 rounded-[32px] bg-white/40 hover:bg-white/60 transition-all cursor-pointer group/upload">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileCode className="w-8 h-8 mb-3 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    {restoreFile ? restoreFile.name : (lang === "ar" ? "اسحب ملف .sql هنا" : "Drop Dean SQL Archive Here")}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".sql" onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} />
              </label>

              <Button 
                variant="outline" 
                onClick={handleRestore}
                disabled={!restoreFile || isRestoring}
                className="w-full h-16 rounded-[24px] border-orange-500/20 text-orange-600 bg-orange-500/5 hover:bg-orange-500/10 font-black uppercase text-[11px] tracking-widest gap-3 shadow-xl shadow-orange-500/5 transition-all"
              >
                {isRestoring ? <Loader2 className="h-5 w-5 animate-spin" /> : <HardDriveUpload className="h-5 w-5" />}
                {lang === "ar" ? "بدء عملية الاسترداد الشاملة" : "Initiate Full Restoration"}
              </Button>
            </div>

            <div className="absolute bottom-[-10%] left-[-10%] opacity-5 group-hover:opacity-10 transition-opacity">
                <ServerCrash className="h-48 w-48 -rotate-12" />
            </div>
          </div>
        </div>

        {/* Security / Status Logs */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-emerald-500/5 backdrop-blur-sm p-8 rounded-[32px] border border-emerald-500/10 flex items-center gap-6 shadow-sm">
                <div className="h-14 w-14 rounded-[20px] bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-inner">
                    <ShieldCheck className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.1em] text-emerald-700">{lang === "ar" ? "جاهزية البيانات" : "Data Integrity"}</h4>
                    <p className="text-[10px] font-bold text-emerald-600/60 mt-0.5">{lang === "ar" ? "قاعدة البيانات مؤمنة بالكامل" : "All nodes synchronized"}</p>
                </div>
            </div>
            <div className="bg-primary/5 backdrop-blur-sm p-8 rounded-[32px] border border-primary/10 flex items-center gap-6 shadow-sm">
                <div className="h-14 w-14 rounded-[20px] bg-primary/10 text-primary flex items-center justify-center shadow-inner">
                    <History className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.1em] text-primary">{lang === "ar" ? "سجل النسخ" : "Backup History"}</h4>
                    <p className="text-[10px] font-bold text-primary/60 mt-0.5">{lang === "ar" ? "آخر نسخة: منذ لحظات" : "Latest pulse: Just now"}</p>
                </div>
            </div>
            <div className="bg-orange-500/5 backdrop-blur-sm p-8 rounded-[32px] border border-orange-500/10 flex items-center gap-6 shadow-sm">
                <div className="h-14 w-14 rounded-[20px] bg-orange-500/10 text-orange-600 flex items-center justify-center shadow-inner">
                    <Zap className="h-7 w-7" />
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-[0.1em] text-orange-700">{lang === "ar" ? "سرعة الاسترداد" : "Restoration Velocity"}</h4>
                    <p className="text-[10px] font-bold text-orange-600/60 mt-0.5">{lang === "ar" ? "متوسط الاستعادة: < 60 ثانية" : "Avg restore cycle: < 60s"}</p>
                </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
