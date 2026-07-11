import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { Terminal, Cpu, FolderOpen, ArrowRight } from "lucide-react";

export function ProjectTransitionModal() {
  const navigate = useNavigate();
  const transitioningProject = useStore((state) => state.transitioningProject);
  const triggerProjectTransition = useStore((state) => state.triggerProjectTransition);

  useEffect(() => {
    if (!transitioningProject) return;

    const timer = setTimeout(() => {
      const targetId = transitioningProject.id;
      triggerProjectTransition(null);
      navigate(`/projects/${targetId}`);
    }, 1100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        clearTimeout(timer);
        const targetId = transitioningProject.id;
        triggerProjectTransition(null);
        navigate(`/projects/${targetId}`);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [transitioningProject, navigate, triggerProjectTransition]);

  return (
    <AnimatePresence>
      {transitioningProject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] bg-[#050505] text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden font-sans"
        >
          {/* Subtle monochrome grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#222_1px,transparent_1px)] [background-size:32px_32px] opacity-40 pointer-events-none" />
          
          {/* Decorative ambient lighting */}
          <div className="absolute w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none -top-32 -left-32 animate-pulse" />
          <div className="absolute w-[600px] h-[600px] bg-white/[0.03] rounded-full blur-3xl pointer-events-none -bottom-32 -right-32 animate-pulse" />

          <div className="relative z-10 flex flex-col items-center max-w-5xl text-center w-full">
            {/* Top status pill */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#141414] border border-[#2c2c2c] shadow-2xl mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span className="text-xs font-mono tracking-widest uppercase text-gray-300 font-semibold">
                Launching Project Environment
              </span>
              <Cpu className="w-3.5 h-3.5 text-gray-400 ml-1" />
            </motion.div>

            {/* Massive Cinematic Project Name */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-6xl sm:text-8xl md:text-9xl font-black tracking-tighter uppercase text-center bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-100 to-gray-500 drop-shadow-2xl max-w-full truncate px-4 leading-none py-2"
            >
              {transitioningProject.name}
            </motion.h1>

            {/* Subtitle / module loading status */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="mt-8 flex items-center gap-6 text-sm font-mono text-gray-400"
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-gray-300" />
                <span>Mounting Virtual Workspace...</span>
              </div>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-gray-300" />
                <span>Initializing Terminal & Editor...</span>
              </div>
            </motion.div>

            {/* Animated Monochrome Progress Line */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="w-full max-w-md h-1 bg-[#1a1a1a] rounded-full overflow-hidden mt-10 relative border border-[#2a2a2a]"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.0, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-gray-600 via-gray-200 to-white rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8)]"
              />
            </motion.div>

            {/* Skip hint */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.5 }}
              onClick={() => {
                const targetId = transitioningProject.id;
                triggerProjectTransition(null);
                navigate(`/projects/${targetId}`);
              }}
              className="mt-8 text-xs font-mono text-gray-500 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 select-none"
            >
              <span>Click or press ESC to enter immediately</span>
              <ArrowRight className="w-3 h-3" />
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
