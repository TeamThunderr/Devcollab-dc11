import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";

interface SocialButtonProps extends HTMLMotionProps<"button"> {
  icon: React.ReactNode;
}

export function SocialButton({ icon, className, ...props }: SocialButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      className={cn(
        "flex items-center justify-center w-11 h-11 rounded-lg transition-all duration-300",
        "bg-[#FFFFFF] dark:bg-[#111111]",
        "border border-[#D4D4D8] dark:border-[#262626]",
        "hover:bg-[#F4F4F5] dark:hover:bg-[#18181B]",
        "focus:outline-none focus:ring-2 focus:ring-zinc-500/30",
        "text-[#09090B] dark:text-[#FFFFFF]",
        className
      )}
      {...props}
    >
      {icon}
    </motion.button>
  );
}
