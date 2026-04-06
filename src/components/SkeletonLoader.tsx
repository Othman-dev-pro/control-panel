import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60 relative overflow-hidden",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent",
        className
      )}
      {...props}
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function OwnerCardSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((j) => (
              <Skeleton key={j} className="h-12 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Skeleton className="h-10 rounded-xl" />
            <Skeleton className="h-10 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <Skeleton className="h-6 w-32" />
      </div>
      <div className="p-0">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border last:border-0">
            <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-4 w-20 hidden sm:block" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
export function PlanCardSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="relative rounded-[32px] border border-border bg-card p-8 space-y-6 shadow-sm overflow-hidden">
          <div className="space-y-2">
            <Skeleton className="h-7 w-1/2 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-4 w-1/3 rounded-md" />
          </div>
          <div className="space-y-3 pt-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-3 w-3/4 rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-6">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-12 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdCardSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[24px] border border-border/50 bg-card/60 p-5 flex flex-col sm:flex-row gap-6 shadow-sm animate-in fade-in duration-500">
          <Skeleton className="h-32 w-full sm:w-56 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-4 py-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-12 rounded-full" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <Skeleton className="h-10 rounded-xl" />
              <Skeleton className="h-10 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
