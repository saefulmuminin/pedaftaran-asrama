import React from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, hover = false, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-4xl border border-slate-100 shadow-sm transition-all duration-300",
        hover && "hover:shadow-premium hover:-translate-y-1 cursor-pointer hover:border-primary-100",
        (onClick || hover) && "cursor-pointer",
        // Add bg-white only if no background class is provided
        !className?.includes("bg-") && "bg-white",
        className
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon, color, description, className }: StatCardProps) {
  return (
    <Card className={cn("p-8 group relative overflow-hidden transition-all duration-500", color, className)}>
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-4">
          <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">{title}</p>
          <p className="text-4xl font-black tracking-tight text-white">{value}</p>
          {description && (
            <p className="text-[11px] font-bold text-white/50 leading-relaxed max-w-[140px]">{description}</p>
          )}
        </div>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-md ring-1 ring-white/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
          <div className="w-7 h-7 text-white flex items-center justify-center">
            {icon}
          </div>
        </div>
      </div>
    </Card>
  );
}
