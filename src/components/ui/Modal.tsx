"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Modal({ open, onClose, title, children, size = "md", className }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-500" />
      <div
        className={cn(
          "relative bg-white rounded-3xl shadow-2xl w-full overflow-hidden animate-in zoom-in-95 slide-in-bottom duration-500",
          sizes[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-8 py-5 border-b border-slate-50">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}
