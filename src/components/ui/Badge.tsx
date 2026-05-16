import { cn } from "@/lib/utils";
import { getStatusColor, getStatusLabel, getKamarStatusColor, getKamarStatusLabel } from "@/lib/utils";

interface BadgeProps {
  label?: string;
  status?: string;
  kamarStatus?: string;
  className?: string;
}

export function Badge({ label, status, kamarStatus, className }: BadgeProps) {
  if (status) {
    const colorClass = getStatusColor(status);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
          colorClass,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {getStatusLabel(status)}
      </span>
    );
  }
  if (kamarStatus) {
    const colorClass = getKamarStatusColor(kamarStatus);
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider",
          colorClass,
          className
        )}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        {getKamarStatusLabel(kamarStatus)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600",
        className
      )}
    >
      {label}
    </span>
  );
}
