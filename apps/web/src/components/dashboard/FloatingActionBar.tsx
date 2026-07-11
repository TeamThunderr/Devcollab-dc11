import React, { useState } from "react";
import { Sparkles, Plus, Code, Sun, BookOpen, Search, X } from "lucide-react";
import { TaskModal } from "./TaskModal";
import { motion, AnimatePresence } from "framer-motion";
import { Tooltip } from "../ui/Tooltip";
import { useNavigate, useParams } from "react-router-dom";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects"
import { useStore } from "../../store/useStore";

export function FloatingActionBar() {
  const navigate = useNavigate();
  const { projectId: routeProjectId } = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const { data: projects = [] } = useProjects(workspaceId);
  
  const projectId = routeProjectId || projects[0]?.id;

  const handleAction = (type: string) => {
    switch (type) {
      case 'ai':
        navigate(projectId ? `/projects/${projectId}/ai` : '/ai');
        break;
      case 'new':
        if (projectId) {
          setIsTaskModalOpen(true);
        } else {
          navigate('/projects'); 
        }
        break;
      case 'snippets':
        if (projectId) navigate(`/projects/${projectId}/snippets`);
        else navigate('/projects');
        break;
      case 'status':
        navigate(projectId ? `/projects/${projectId}/activity` : '/activity');
        break;
      case 'wiki':
        if (projectId) navigate(`/projects/${projectId}/wiki`);
        else navigate('/projects');
        break;
      case 'search':
        navigate(projectId ? `/projects/${projectId}/activity?focusSearch=true` : `/activity?focusSearch=true`);
        break;
    }
    setIsOpen(false);
  };
  
  const actions = [
    { type: 'ai', icon: <Sparkles className="w-5 h-5" />, tooltip: "AI Intelligence" },
    { type: 'new', icon: <Plus className="w-5 h-5" />, tooltip: "New Project" },
    { type: 'snippets', icon: <Code className="w-5 h-5" />, tooltip: "Snippets" },
    { type: 'status', icon: <Sun className="w-5 h-5" />, tooltip: "Status Report" },
    { type: 'wiki', icon: <BookOpen className="w-5 h-5" />, tooltip: "Wiki" },
    { type: 'search', icon: <Search className="w-5 h-5" />, tooltip: "Search" },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="flex flex-col gap-2"
          >
            {actions.map((action) => (
              <ActionButton 
                key={action.type}
                icon={action.icon} 
                tooltip={action.tooltip} 
                active={action.type === 'new'}
                onClick={() => handleAction(action.type)} 
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="w-7 h-7" />
        </motion.div>
      </button>
      {projectId && (
        <TaskModal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          mode="create"
          projectId={parseInt(projectId.toString(), 10)}
        />
      )}
    </div>
  );
}

function ActionButton({ icon, tooltip, active = false, onClick }: { icon: React.ReactNode; tooltip: string; active?: boolean; onClick?: () => void }) {
  return (
    <Tooltip content={tooltip} side="left">
      <button 
        onClick={onClick}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all border border-gray-200 dark:border-[#2C2C2C] shadow-lg ${
        active 
          ? "bg-black text-white dark:bg-white dark:text-black" 
          : "bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}>
        {icon}
      </button>
    </Tooltip>
  );
}
