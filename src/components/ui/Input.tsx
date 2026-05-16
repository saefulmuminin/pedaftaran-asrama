import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Input({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
          {props.required && <span className="text-primary-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            "w-full rounded-2xl border bg-white px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm",
            "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
            "transition-all duration-300",
            error
              ? "border-rose-400 focus:ring-rose-400/20"
              : "border-slate-200 hover:border-primary-300",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helperText && !error && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
          {props.required && <span className="text-primary-600 ml-1">*</span>}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          "w-full rounded-2xl border bg-white px-5 py-3 text-sm text-slate-900 shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "transition-all duration-300",
          error
            ? "border-rose-400 focus:ring-rose-400/20"
            : "border-slate-200 hover:border-primary-300",
          className
        )}
        {...props}
      >
        <option value="">-- Pilih --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function TextArea({ label, error, className, id, ...props }: TextAreaProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label}
          {props.required && <span className="text-primary-600 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        rows={4}
        className={cn(
          "w-full rounded-2xl border bg-white px-5 py-3 text-sm text-slate-900 placeholder:text-slate-400 resize-none shadow-sm",
          "focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
          "transition-all duration-300",
          error
            ? "border-rose-400 focus:ring-rose-400/20"
            : "border-slate-200 hover:border-primary-300",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
