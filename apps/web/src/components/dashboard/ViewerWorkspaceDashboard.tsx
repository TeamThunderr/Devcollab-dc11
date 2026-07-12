import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { GreetingSection } from "./GreetingSection";
import { StatsGrid } from "./StatsGrid";
import { useWorkspaces, useWorkspaceStats } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects";
import { Folder, ArrowRight } from "lucide-react";

export function ViewerWorkspaceDashboard() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;
  
  const { data: stats } = useWorkspaceStats(workspaceId);
  const { data: projects = [] } = useProjects(workspaceId);

  return (
    <div>
      <GreetingSection />
      
      <StatsGrid 
        firstValue={stats?.activeProjects?.toString() || "0"}
        firstLabel="Total Projects"
        secondValue={stats?.teamMembers?.toString() || "0"}
        secondLabel="Workspace Members"
        thirdValue={stats?.totalTasks?.toString() || "0"}
        thirdLabel="Tasks Overview"
      />

      <div className="mt-8 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-500" />
            Projects Overview
          </h3>
          <button 
            onClick={() => navigate('/projects')}
            className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 font-medium transition-colors flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.length > 0 ? (
            projects.slice(0, 6).map(project => (
              <div 
                key={project.id} 
                onClick={() => navigate(`/projects/${project.id}/overview`)}
                className="flex flex-col p-5 bg-gray-50 dark:bg-[#191919] rounded-lg border border-gray-100 dark:border-[#2C2C2C] hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {project.name}
                  </h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50' 
                      : 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border border-gray-300 dark:border-gray-700'
                  }`}>
                    {project.status}
                  </span>
                </div>
                {project.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 flex-1">
                    {project.description}
                  </p>
                )}
                <div className="mt-auto flex items-center justify-between text-[11px] text-gray-500 font-medium">
                  <span>{project.tasksCount || 0} Tasks</span>
                  <span>{project.members?.length || 0} Members</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg text-center">
              <Folder className="w-8 h-8 text-gray-400 mb-3" />
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No Projects Found</h4>
              <p className="text-xs text-gray-500">There are no projects available to view in this workspace.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
