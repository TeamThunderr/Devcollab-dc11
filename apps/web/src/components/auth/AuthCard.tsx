import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { useTheme } from "../../hooks/useTheme";

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        background: theme === "dark"
          ? "linear-gradient(135deg, #050505, #0F0F0F, #171717)"
          : "linear-gradient(135deg, #FFFFFF, #FAFAFA, #F4F4F5)",
        boxShadow: theme === "dark"
          ? "0 0 60px rgba(255,255,255,0.04)"
          : "0 10px 40px rgba(0,0,0,0.08)",
        borderColor: theme === "dark" ? "#262626" : "#E4E4E7"
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "relative w-full overflow-hidden rounded-3xl backdrop-blur-xl border",
        "min-h-[650px] flex",
        className
      )}
    >
      {children}
    </motion.div>
  );
}
