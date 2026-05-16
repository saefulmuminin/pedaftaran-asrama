import React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 font-bold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] hover:scale-[1.02]";

  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-premium",
    secondary:
      "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 focus:ring-primary-500 shadow-sm",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-sm",
    ghost:
      "text-slate-600 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-400",
    outline:
      "border-2 border-slate-200 text-slate-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700 focus:ring-primary-400",
  };

  const sizes = {
    sm: "px-4 py-2 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
