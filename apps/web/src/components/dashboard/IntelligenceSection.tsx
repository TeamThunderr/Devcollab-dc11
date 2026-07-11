import React from "react";
import { Sparkles, BookOpen, Code, Sun, Activity, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects"
import { useStore } from "../../store/useStore";

export function IntelligenceSection() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const { data: projects = [] } = useProjects(workspaceId);
  const projectId = projects[0]?.id;

  const handleNavigate = (path: string) => {
    if (projectId) {
      navigate(`/projects/${projectId}/${path}`);
    } else {
      navigate(`/projects`);
    }
  };

  return (
    <div className="mb-16">
      <div className="flex items-center gap-2 mb-6 text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">
        <Sparkles className="w-3.5 h-3.5" />
        Quick Actions
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 overflow-x-auto pb-2">
        <QuickActionChip 
          icon={<BookOpen className="w-4 h-4" />}
          title="Wiki Plan"
          onClick={() => handleNavigate("wiki")}
        />
        <QuickActionChip 
          icon={<Code className="w-4 h-4" />}
          title="Code Review"
          onClick={() => handleNavigate("editor")}
        />
        <QuickActionChip 
          icon={<Sun className="w-4 h-4" />}
          title="Status Report"
          onClick={() => handleNavigate("activity")}
        />
        <QuickActionChip 
          icon={<Activity className="w-4 h-4" />}
          title="Tech Blueprint"
          onClick={() => handleNavigate("snippets")}
        />
        <QuickActionChip 
          icon={<HeartPulse className="w-4 h-4" />}
          title="Project Summary"
          onClick={() => handleNavigate("overview")}
        />
      </div>
    </div>
  );
}

function QuickActionChip({ icon, title, onClick }: { icon: React.ReactNode; title: string; onClick?: () => void }) {
  return (
    <motion.div 
      onClick={onClick}
      whileHover={{ y: -2 }}
      className="flex items-center gap-2.5 p-3 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] hover:shadow-sm cursor-pointer transition-shadow duration-200 min-w-max"
    >
      <div className="text-gray-500 dark:text-gray-400 flex-shrink-0">
        {icon}
      </div>
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{title}</div>
    </motion.div>
  );
}
