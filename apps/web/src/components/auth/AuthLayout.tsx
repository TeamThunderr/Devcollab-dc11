import React from "react";
import { motion } from "framer-motion";
import { ThemeToggle } from "../common/ThemeToggle";
import { useTheme } from "../../hooks/useTheme";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  const { theme } = useTheme();

  return (
    <motion.div 
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center p-4 sm:p-8"
      animate={{
        background: theme === "dark" 
          ? "#000000" 
          : "linear-gradient(180deg, #FFFFFF, #F4F4F5)"
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <ThemeToggle />
      <div className="relative z-10 w-full max-w-4xl">{children}</div>
    </motion.div>
  );
}
