import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { 
  UserX, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  MessageSquare, 
  Phone, 
  Building2, 
  Calendar,
  AlertCircle,
  Loader2,
  Trash2,
  Search
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDeletionRequests, useApproveDeletion, useRejectDeletion } from "@/hooks/useAdminData";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { TableSkeleton as SkeletonLoader } from "@/components/SkeletonLoader";

export default function AdminDeletionRequests() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: requests, isLoading } = useDeletionRequests();
  const approveMutation = useApproveDeletion();
  const rejectMutation = useRejectDeletion();

  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminMessage, setAdminMessage] = useState("");
  const [deletionDays, setDeletionDays] = useState(1);
  const [deletionType, setDeletionType] = useState<"scheduled" | "immediate">("immediate");

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    try {
      if (actionType === "approve") {
        await approveMutation.mutateAsync({
          requestId: selectedRequest.id,
          ownerId: selectedRequest.owner_id,
          message: adminMessage,
          days: deletionType === "scheduled" ? deletionDays : undefined,
          isManual: deletionType === "immediate"
        });
        toast({ title: t("common.success"), description: deletionType === "immediate" ? t("deletion.approved") : t("deletion.scheduled") });
      } else {
        await rejectMutation.mutateAsync({
          requestId: selectedRequest.id,
          ownerId: selectedRequest.owner_id,
          message: adminMessage
        });
        toast({ title: t("common.success"), description: t("deletion.rejected") });
      }
      setSelectedRequest(null);
      setAdminMessage("");
    } catch (err: any) {
      toast({ variant: "destructive", title: t("common.error"), description: err.message });
    }
  };

  const filteredRequests = requests?.filter((r: any) => {
    const owner = r.profiles;
    const searchStr = `${owner?.name} ${owner?.business_name} ${owner?.phone}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-in fade-in duration-700 pb-20">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card/40 backdrop-blur-md p-8 rounded-[40px] border border-border/50 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-5 relative z-10">
            <div className="h-16 w-16 rounded-[24px] bg-red-500/10 text-red-500 flex items-center justify-center ring-1 ring-red-500/20 shadow-inner">
              <UserX className="h-9 w-9" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">{t("nav.deletionRequests")}</h1>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] opacity-60 mt-1">Management & Compliance Center</p>
            </div>
          </div>

          <div className="relative w-full md:w-80 group mt-4 md:mt-0 z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={t("admin.searchOwners")}
              className="w-full h-12 bg-white/50 border-border/50 rounded-2xl pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all placeholder:text-muted-foreground/50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="absolute top-[-20%] right-[-10%] w-[35%] h-[150%] bg-red-500/5 rotate-12 blur-[120px] pointer-events-none" />
        </div>

        {/* Pending Requests Section */}
        <div className="grid gap-6">
          {isLoading ? (
            <SkeletonLoader rows={3} />
          ) : filteredRequests?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card/40 backdrop-blur-sm rounded-[40px] border border-dashed border-border/50">
              <div className="h-20 w-20 rounded-[30px] bg-muted/30 flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-lg font-black text-muted-foreground/60 uppercase tracking-widest">{t("common.noData")}</p>
            </div>
          ) : (
            filteredRequests?.map((request: any) => (
              <div 
                key={request.id} 
                className="group bg-card/60 backdrop-blur-sm p-8 rounded-[40px] border border-border/50 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
                  <div className="flex flex-col md:flex-row md:items-center gap-8 flex-1">
                    {/* Owner Info */}
                    <div className="flex items-center gap-5">
                      <div className="h-14 w-14 rounded-[20px] bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                        <Building2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-foreground tracking-tight">{request.profiles?.business_name || "---"}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-black bg-primary/10 text-primary px-2.5 py-1 rounded-lg uppercase tracking-wider">
                            {request.profiles?.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meta Info */}
                    <div className="grid grid-cols-2 md:flex items-center gap-6">
                      <div className="flex items-center gap-2.5 text-muted-foreground">
                        <Phone className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-bold font-mono tracking-tighter">{request.profiles?.phone}</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-muted-foreground border-l border-border/50 pl-6">
                        <Calendar className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-bold tracking-tight">
                          {new Date(request.created_at).toLocaleDateString(lang === 'ar' ? 'ar-YE' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 border-l border-border/50 pl-6">
                        <div className={cn(
                          "h-2 w-2 rounded-full animate-pulse",
                          request.status === 'pending' ? "bg-amber-500" : 
                          request.status === 'scheduled' ? "bg-blue-500" : 
                          request.status === 'approved' ? "bg-emerald-500" : 
                          request.status === 'rejected' ? "bg-red-500" : "bg-muted"
                        )} />
                        <span className={cn(
                          "text-[10px] font-black uppercase tracking-[0.15em]",
                          request.status === 'pending' ? "text-amber-600" : 
                          request.status === 'scheduled' ? "text-blue-600" :
                          request.status === 'approved' ? "text-emerald-600" : 
                          request.status === 'rejected' ? "text-red-700" : "text-muted-foreground"
                        )}>
                          {t(`deletion.${request.status}`)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        onClick={() => { setSelectedRequest(request); setActionType("reject"); }}
                        variant="outline"
                        className="h-14 rounded-2xl border-red-500/20 bg-red-500/5 text-red-600 hover:bg-red-500/10 hover:border-red-500/40 font-black uppercase text-[10px] tracking-widest gap-2 shadow-sm transition-all"
                      >
                        <XCircle className="h-4 w-4" />
                        {t("orders.reject")}
                      </Button>
                      <Button
                        onClick={() => { setSelectedRequest(request); setActionType("approve"); }}
                        className="h-14 rounded-2xl bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl shadow-primary/20 transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {t("orders.approve")}
                      </Button>
                    </div>
                  )}

                  {request.admin_message && (
                    <div className="mt-4 p-4 rounded-2xl bg-muted/40 border border-border/50 flex items-start gap-3">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <p className="text-[11px] font-medium text-muted-foreground italic leading-relaxed">
                            {request.admin_message}
                        </p>
                    </div>
                  )}
                </div>

                <div className="absolute top-[-10%] left-[-10%] w-[30%] h-[150%] bg-primary/5 rotate-45 blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              </div>
            ))
          )}
        </div>

        {/* Action Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
          <DialogContent className="rounded-[40px] border-none shadow-2xl backdrop-blur-xl bg-white/90 p-8 max-w-md">
            <DialogHeader className="space-y-4">
              <div className={cn(
                "h-16 w-16 rounded-[24px] flex items-center justify-center mx-auto shadow-inner ring-1",
                actionType === "approve" ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" : "bg-red-500/10 text-red-600 ring-red-500/20"
              )}>
                {actionType === "approve" ? <Trash2 className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
              </div>
              <DialogTitle className="text-2xl font-black text-center tracking-tight uppercase">
                {actionType === "approve" ? t("orders.approve") : t("orders.reject")}
              </DialogTitle>
              <DialogDescription className="text-center font-bold text-xs text-muted-foreground leading-relaxed px-4">
                {actionType === "approve" ? t("deletion.approveConfirm") : t("deletion.rejectConfirm")}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-4">
               {actionType === "approve" && (
                 <>
                   <div className="space-y-3 mb-6 p-4 rounded-3xl bg-muted/20 border border-border/50">
                     <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                       {t("deletion.type")}
                     </label>
                     <div className="flex gap-2">
                       <Button
                         type="button"
                         variant={deletionType === "immediate" ? "default" : "outline"}
                         onClick={() => setDeletionType("immediate")}
                         className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                       >
                         {t("deletion.immediate")}
                       </Button>
                       <Button
                         type="button"
                         variant={deletionType === "scheduled" ? "default" : "outline"}
                         onClick={() => setDeletionType("scheduled")}
                         className="flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                       >
                         {t("deletion.scheduled")}
                       </Button>
                     </div>
                   </div>

                   {deletionType === "scheduled" && (
                     <div className="space-y-2 mb-4 animate-in slide-in-from-top-2 duration-300">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                         {t("deletion.days")}
                       </label>
                       <input
                          type="number"
                          min="1"
                          className="w-full h-12 rounded-2xl bg-muted/30 border-border/50 px-4 text-sm font-bold focus:ring-primary/20 outline-none"
                          value={deletionDays}
                          onChange={(e) => setDeletionDays(parseInt(e.target.value) || 1)}
                       />
                     </div>
                   )}
                 </>
               )}
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                   {t("deletion.responsePlaceholder")}
                 </label>
                 <Textarea
                    className="rounded-3xl bg-muted/30 border-border/50 focus:ring-primary/20 focus:border-primary/30 min-h-[120px] text-sm font-medium"
                    placeholder="..."
                    value={adminMessage}
                    onChange={(e) => setAdminMessage(e.target.value)}
                 />
               </div>
            </div>

            <DialogFooter className="mt-10 sm:justify-start gap-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedRequest(null)}
                className="flex-1 h-16 rounded-[22px] font-black uppercase text-[10px] tracking-widest hover:bg-muted"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleAction}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                className={cn(
                  "flex-[2] h-16 rounded-[22px] font-black uppercase text-[10px] tracking-widest gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-white",
                  actionType === "approve" ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20" : "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                )}
              >
                {(approveMutation.isPending || rejectMutation.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

// Utility for conditional classes
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(" ");
}

import { ShieldCheck } from "lucide-react";
