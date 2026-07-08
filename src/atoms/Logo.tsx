import { cn } from "@/lib/utils";
import { Heart } from "lucide-react";

interface LogoProps {
  className?: string;
  compact?: boolean;
  tone?: "dark" | "light";
}

export function Logo({ className, compact, tone = "dark" }: LogoProps) {
  const color = tone === "light" ? "text-porcelain" : "text-midnight";
  return (
    <div className={cn("flex flex-col leading-tight", color, className)}>
      <span className="font-display text-2xl md:text-[26px] font-semibold tracking-tight flex items-center gap-1.5">
        Chuanga
        <Heart className="h-4 w-4 fill-current text-rose-deep" strokeWidth={0} />
        Studio
      </span>
      {!compact && (
        <span
          className="font-display italic text-[13px] tracking-wide opacity-75 -mt-0.5"
        >
          por Angela Mazive
        </span>
      )}
    </div>
  );
}
