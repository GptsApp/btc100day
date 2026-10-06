import React from "react";
import { cn } from "@/lib/utils";

interface DotBackgroundProps {
  children?: React.ReactNode;
  className?: string;
}

export const DotBackground: React.FC<DotBackgroundProps> = ({
  children,
  className,
}) => {
  return (
    <div className={cn("relative w-full h-full min-h-screen bg-[#f8fafc]", className)}>
      <div className="relative z-10">{children}</div>
    </div>
  );
};
