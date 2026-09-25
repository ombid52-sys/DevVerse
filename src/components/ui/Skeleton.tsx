import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse bg-neutral-200 rounded-md", className)}
      {...props}
    />
  );
}

export function AppCardSkeleton() {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex flex-col gap-3">
      <Skeleton className="w-full h-36 rounded-md" />
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="flex items-center justify-between pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-20" />
      </div>
    </div>
  );
}
