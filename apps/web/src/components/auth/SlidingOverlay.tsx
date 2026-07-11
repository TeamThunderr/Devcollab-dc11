import React from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "../common/Logo";

interface SlidingOverlayProps {
  isRegister: boolean;
  onToggle: () => void;
}

export function SlidingOverlay({ isRegister, onToggle }: SlidingOverlayProps) {
  return (
    <motion.div
      className="hidden md:flex absolute top-0 right-0 w-1/2 h-full bg-transparent border-l border-r border-zinc-200 dark:border-[#262626] overflow-hidden z-20 pointer-events-none"
      initial={false}
      animate={{ x: isRegister ? "-100%" : "0%" }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      {/* Background that moves with the panel */}
      <div className="absolute inset-0 w-full h-full bg-zinc-50 dark:bg-[#0A0A0A]/50 backdrop-blur-md pointer-events-auto" />

      {/* Content wrapper to slide internal content oppositely to create parallax or smooth crossfade effect */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between items-start p-12 pointer-events-auto">
        <Logo className="mb-12" />

        <div className="flex-1 w-full relative">
          <AnimatePresence mode="wait">
            {!isRegister ? (
              <motion.div
                key="login-promo"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <h2 className="text-2xl font-bold mb-8 text-black dark:text-white tracking-tight transition-colors duration-300">
                  Trusted by developers worldwide
                </h2>

                <ul className="space-y-4">
                  {[
                    "Real-time Collaboration",
                    "Workspace Management",
                    "Team Notifications",
                    "Project Tracking"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-black/90 dark:text-zinc-300 transition-colors duration-300">
                      <Check size={18} className="text-black dark:text-white" />
                      <span className="font-medium text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              <motion.div
                key="register-promo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0"
              >
                <h2 className="text-2xl font-bold mb-8 text-black dark:text-white tracking-tight transition-colors duration-300">
                  Welcome Back!
                </h2>
                <p className="text-sm text-black/80 dark:text-zinc-400 mb-8 transition-colors duration-300 leading-relaxed">
                  To keep connected with your workspace, please login with your personal info.
                </p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3 text-black/90 dark:text-zinc-300 transition-colors duration-300">
                    <Check size={18} className="text-black dark:text-white" />
                    <span className="font-medium text-sm">Secure Authentication</span>
                  </li>
                  <li className="flex items-center gap-3 text-black/90 dark:text-zinc-300 transition-colors duration-300">
                    <Check size={18} className="text-black dark:text-white" />
                    <span className="font-medium text-sm">Seamless Sync</span>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 w-full mt-8">
          <button
            onClick={onToggle}
            className="inline-flex items-center justify-center w-full p-3 rounded-xl bg-transparent border border-zinc-200 dark:border-[#262626] hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors duration-300 cursor-pointer"
          >
            <span className="font-semibold text-sm text-black dark:text-white transition-colors duration-300">
              {isRegister ? "Sign In" : "Create an account"}
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
