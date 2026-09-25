import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "brand" | "neutral" | "success" | "warning" | "danger" | "outline";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    brand: "bg-blue-50 text-brand-600 border-blue-200",
    neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    outline: "bg-transparent text-neutral-600 border-neutral-300",
  };

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium border rounded",
    md: "text-xs px-2.5 py-0.5 font-medium border rounded-md",
  };

  return (
    <span
      className={cn("inline-flex items-center gap-1 leading-none select-none", variantStyles[variant], sizeStyles[size], className)}
      {...props}
    >
      {children}
    </span>
  );
}
