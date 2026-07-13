import React from "react";
import { Plus, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

import { useRole } from "../../context/RBACContext";
import { getProjectPermissions } from "../../lib/projectPermissions";
import { useWorkspaces } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects";
import { useTasks } from "../../hooks/useTasks";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom"
import { useStore } from "../../store/useStore";

export function GreetingSection({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const { role, permissions } = useRole();
  const perms = getProjectPermissions(role);
  
  const { currentUser } = useAuth();
  
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  const workspace = activeWorkspaceObj || { name: 'Workspace' };

  const { data: projects = [] } = useProjects(workspaceId);
  const parsedId = parseInt(projectId || "0", 10);
  const project = projects.find(p => p.id === parsedId);
  
  const { data: tasks = [] } = useTasks(parsedId);
  
  const greetingName = currentUser?.name || "Sanjay";
  
  if (projectId && project) {
    const projectTasks = tasks;
    const projectMembersCount = 0; // Members logic not wired to project yet
    
    return (
      <div className="flex items-end justify-between py-12">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.12em]">
              {project.name}
            </span>
          </div>
          
          <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-[-0.03em] leading-tight">
            {project.name}
          </h1>
          <p className="text-gray-500 text-[0.9rem]">
            {projectTasks.length} tasks · {projectMembersCount} members
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          {perms.canCollaborate && (
            <button 
              onClick={() => navigate(`/projects/${projectId}/ai`)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-[#191919]/50 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI
            </button>
          )}
          {perms.canCollaborate && (
            <button 
              onClick={() => navigate(`/projects/${projectId}/board`)}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              View Board
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-end justify-between py-12">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-gray-400 uppercase tracking-[0.12em]">
            {workspace.name}
          </span>
        </div>
        
        <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-gray-100 mb-2 tracking-[-0.03em] leading-tight">
          Good evening, {greetingName}
        </h1>
        <p className="text-gray-500 text-[0.9rem]">
          {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      </motion.div>

      <div className="flex items-center gap-3">
        {role !== 'VIEWER' && (
          <button 
            onClick={() => navigate(`/ai`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-[#191919]/50 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>
        )}
        {permissions?.canCreateProject && (
          <button 
            onClick={() => navigate(`/projects`)}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white dark:bg-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Project
          </button>
        )}
      </div>
    </div>
  );
}
