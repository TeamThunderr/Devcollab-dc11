import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../hooks/useTheme";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggleTheme}
      className={cn(
        "relative p-2.5 rounded-full transition-all duration-300 flex items-center justify-center",
        "bg-[#FFFFFF] dark:bg-[#000000]",
        "border border-[#D4D4D8] dark:border-[#262626]",
        "text-black dark:text-[#FFFFFF]",
        "hover:bg-[#F4F4F5] dark:hover:bg-[#111111]",
        className
      )}
      aria-label="Toggle theme"
    >
      <motion.div
        initial={false}
        animate={{ rotate: theme === "dark" ? 0 : 180 }}
        transition={{ duration: 0.5, ease: "backOut" }}
      >
        {theme === "dark" ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </motion.div>
    </motion.button>
  );
}
