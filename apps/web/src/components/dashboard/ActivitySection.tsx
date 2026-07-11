import React, { useMemo } from "react";
import { Folder, ArrowRight, Activity, Clock, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useWorkspaces, useWorkspaceMembers } from "../../hooks/useWorkspaces";
import { useProjects } from "../../hooks/useProjects";
import { useWorkspaceActivity, useProjectActivity } from "../../hooks/useActivity";
import { useWorkspaceTasks } from "../../hooks/useTasks";
import { useRole } from "../../context/RBACContext";

export function ActivitySection({ projectId }: { projectId?: string }) {
  const navigate = useNavigate();
  const triggerProjectTransition = useStore((state) => state.triggerProjectTransition);
  
  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;

  const { data: members = [] } = useWorkspaceMembers(workspaceId);
  const { data: workspaceTasks = [] } = useWorkspaceTasks(workspaceId);

  const { data: projects = [] } = useProjects(workspaceId);
  const parsedId = parseInt(projectId || "0", 10);
  const project = projectId ? projects.find(p => p.id === parsedId) : null;
  const { role, currentUserId } = useRole();

  // For now, project members are just workspace members (since we don't have project-level RBAC yet)
  const projectMembers = members;

  const { data: workspaceActivity = [] } = useWorkspaceActivity(workspaceId);
  const { data: projectActivity = [] } = useProjectActivity(parsedId);

  // Filtered activities
  const activities = useMemo(() => {
    let list = projectId ? projectActivity : workspaceActivity;
    if (role === 'MEMBER') {
      list = list.filter((a: any) => a.userId?.toString() === currentUserId?.toString());
    }
    return [...list].sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
  }, [workspaceActivity, projectActivity, projectId, role, currentUserId]);

  // Format time elapsed
  const formatTime = (isoString?: string) => {
    if (!isoString) return "Just now";
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 pb-24">
      {/* Left Column: Project Members (if projectId present) OR Recent Projects */}
      {projectId && project ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Project Members
            </div>
            <button onClick={() => navigate(`/projects/${projectId}/members`)} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              Manage team <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="border border-gray-200 dark:border-[#2C2C2C] rounded-md overflow-hidden bg-white dark:bg-[#191919]">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 dark:border-[#2C2C2C] text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] bg-gray-50 dark:bg-gray-900/50">
              <div className="col-span-8">Member</div>
              <div className="col-span-4 text-right">Role</div>
            </div>
            
            {projectMembers.map((m: any) => (
              <div key={m.id} className="px-4 py-3 flex items-center grid grid-cols-12 gap-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors border-b border-gray-100 dark:border-[#2C2C2C]/50 last:border-0">
                <div className="col-span-8 flex items-center gap-2">
                  <img src={m.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=random`} alt="Avatar" className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-800" />
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{m.name}</span>
                </div>
                <div className="col-span-4 text-right text-xs text-gray-500 font-medium">
                  {m.role}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] flex items-center gap-2">
              <Folder className="w-3.5 h-3.5" />
              Recent Projects
            </div>
            <button onClick={() => navigate("/projects")} className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="border border-gray-200 dark:border-[#2C2C2C] rounded-md overflow-hidden bg-white dark:bg-[#191919]">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b border-gray-200 dark:border-[#2C2C2C] text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] bg-gray-50 dark:bg-gray-900/50">
              <div className="col-span-6">Name</div>
              <div className="col-span-3">Last Updated</div>
              <div className="col-span-3 text-right">Tasks</div>
            </div>
            
            {projects.map(p => (
              <div key={p.id} onClick={() => triggerProjectTransition({ id: p.id, name: p.name })} className="px-4 py-3 flex items-center grid grid-cols-12 gap-4 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors cursor-pointer border-b border-gray-100 dark:border-[#2C2C2C]/50 last:border-0">
                <div className="col-span-6 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</span>
                </div>
                <div className="col-span-3 flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" /> {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <div className="col-span-3 text-right text-xs text-gray-500">
                  {workspaceTasks.filter(t => t.projectId === p.id).length} tasks
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Right Column: Live Activity */}
      <div>
        <div className="flex items-center mb-6 text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] gap-2">
          <Activity className="w-3.5 h-3.5" />
          Live Activity
        </div>

        <div className="relative border-l border-gray-200 dark:border-[#2C2C2C] ml-3 pl-6 space-y-6">
          {activities.length > 0 ? (
            activities.slice(0, 5).map((act) => {
              const member = members.find(m => m.id === act.userId);
              return (
                <div key={act.id} className="relative">
                  <div className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-black dark:bg-white border-2 border-white dark:border-black"></div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{member?.name || "Someone"}</span> {act.actionType}
                    </div>
                    <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatTime(act.createdAt)}</div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="relative">
              <div className="absolute -left-[29px] top-1 w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 border-2 border-white dark:border-black"></div>
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">No recent activity</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
