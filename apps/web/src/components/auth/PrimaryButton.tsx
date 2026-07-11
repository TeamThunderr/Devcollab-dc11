import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { LoadingSpinner } from "../common/LoadingSpinner";
import { cn } from "../../lib/utils";

interface PrimaryButtonProps extends HTMLMotionProps<"button"> {
  isLoading?: boolean;
  children: React.ReactNode;
}

export function PrimaryButton({
  isLoading,
  children,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      disabled={isLoading || props.disabled}
      className={cn(
        "relative w-full h-12 flex items-center justify-center rounded-xl overflow-hidden font-semibold text-sm transition-colors duration-300",
        "bg-[#09090B] text-[#FFFFFF] hover:bg-[#18181B]",
        "dark:bg-[#FFFFFF] dark:text-[#000000] dark:hover:bg-[#F4F4F5]",
        "dark:shadow-[0_0_30px_rgba(255,255,255,0.08)]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-zinc-500/50 focus:ring-offset-2 dark:focus:ring-offset-[#0A0A0A]",
        className
      )}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size={18} className="text-current" />
      ) : (
        <span className="relative z-10 flex items-center justify-center gap-2">
          {children}
        </span>
      )}
    </motion.button>
  );
}
