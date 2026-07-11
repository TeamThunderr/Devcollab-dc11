

import React from "react";
import { Sidebar } from "../dashboard/Sidebar";
import { Header } from "../dashboard/Header";
import { FloatingActionBar } from "../dashboard/FloatingActionBar";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, Navigate } from "react-router-dom";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const location = useLocation();
  const { data: workspaces, isLoading } = useWorkspaces();

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-[#191919]"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  if (workspaces && workspaces.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#191919] text-gray-600 dark:text-gray-300 text-[0.9rem] leading-[1.7] overflow-hidden transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Header title={title} />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#191919]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="max-w-5xl mx-auto px-12 w-full py-16"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <FloatingActionBar />
      </div>
    </div>
  );
}
