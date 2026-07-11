import React from "react";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Logo } from "../common/Logo";

interface PromoPanelProps {
  buttonText: string;
  buttonLink: string;
}

export function PromoPanel({ buttonText, buttonLink }: PromoPanelProps) {
  return (
    <div className="hidden md:flex flex-col justify-between w-1/2 p-12 bg-zinc-50 dark:bg-[#0A0A0A]/50 border-r border-zinc-200 dark:border-[#262626] relative overflow-hidden">
      <Logo className="mb-12" />
      
      <div className="flex-1 w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
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
      </div>

      <div className="relative z-10 w-full mt-8">
        <Link
          to={buttonLink}
          className="inline-flex items-center justify-center w-full p-3 rounded-xl bg-transparent border border-zinc-200 dark:border-[#262626] hover:bg-zinc-100 dark:hover:bg-[#18181B] transition-colors duration-300 cursor-pointer"
        >
          <span className="font-semibold text-sm text-black dark:text-white transition-colors duration-300">
            {buttonText}
          </span>
        </Link>
      </div>
    </div>
  );
}
