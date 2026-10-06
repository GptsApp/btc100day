import React from "react";
import { cn } from "@/lib/utils";

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  id?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className,
  id,
}) => {
  return (
    <div
      id={id}
      className={cn(
        "relative rounded-xl border border-slate-200 bg-white p-5 md:p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)] transition-all",
        className
      )}
    >
      {children}
    </div>
  );
};
