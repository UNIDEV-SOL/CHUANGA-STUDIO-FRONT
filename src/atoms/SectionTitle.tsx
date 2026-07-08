import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface SectionTitleProps {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  className?: string;
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
  className,
}: SectionTitleProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className,
      )}
    >
      {eyebrow && (
        <div
          className={cn(
            "text-[11px] uppercase tracking-[0.25em] text-rose-deep font-medium mb-4",
            align === "center" && "ornamental-rule justify-center",
          )}
        >
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-4xl md:text-5xl font-medium text-foreground leading-[1.05]">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-muted-foreground text-base md:text-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
