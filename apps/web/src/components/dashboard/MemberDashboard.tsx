import React from "react";
import { useNavigate } from "react-router-dom";
import { useStore, toFrontendStatus } from "../../store/useStore";
import { useRole } from "../../context/RBACContext";
import { GreetingSection } from "./GreetingSection";
import { StatsGrid } from "./StatsGrid";
import { RecentNotifications } from "./RecentNotifications";
import { ActivitySection } from "./ActivitySection";
import { CheckCircle, Clock, Check } from "lucide-react";

export function MemberDashboard() {
  const navigate = useNavigate();
  const { currentUserId } = useRole();
  const triggerProjectTransition = useStore(state => state.triggerProjectTransition);
  const tasks = useStore(state => state.tasks);
  const projects = useStore(state => state.projects);
  const activities = useStore(state => state.activities);
  
  // Calculate stats
  const memberTasks = tasks.filter(t => t.assigneeId && (String(t.assigneeId) === String(currentUserId) || Number(t.assigneeId) === Number(currentUserId)));
  const pendingTasks = memberTasks.filter(t => toFrontendStatus(t.status) !== 'Done');
  const completedTasks = memberTasks.filter(t => toFrontendStatus(t.status) === 'Done');
  const memberProjects = projects.filter(p => Array.isArray(p.members) ? p.members.includes(String(currentUserId)) || p.members.includes(Number(currentUserId)) : true);
  
  // Top 5 pending tasks
  const topPendingTasks = pendingTasks.slice(0, 5);

  return (
    <div>
      <GreetingSection />
      
      <StatsGrid 
        firstValue={pendingTasks.length.toString()}
        firstLabel="Tasks Pending"
        secondValue={completedTasks.length.toString()}
        secondLabel="Tasks Completed"
        thirdValue={memberProjects.length.toString()}
        thirdLabel="Active Projects"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
        
        {/* Assigned Tasks Section */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Top Priority Tasks</h3>
            <button 
              onClick={() => navigate('/tasks')}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {topPendingTasks.length > 0 ? (
              topPendingTasks.map(task => {
                const project = projects.find(p => String(p.id) === String(task.projectId) || p.id === task.projectId);
                return (
                  <div 
                    key={task.id} 
                    onClick={() => navigate(`/projects/${task.projectId}/board`)}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#191919] rounded-lg border border-gray-100 dark:border-[#2C2C2C] hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 p-1.5 rounded-full bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] shadow-sm">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {project?.name || "Unknown Project"}
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded bg-gray-200/60 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                      {task.status}
                    </span>
                  </div>
                )
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg">
                <p className="text-xs text-gray-500">No pending tasks assigned.</p>
              </div>
            )}
          </div>
        </div>

        {/* My Projects Section */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">My Projects</h3>
            <button 
              onClick={() => navigate('/projects')}
              className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 font-medium transition-colors"
            >
              View all
            </button>
          </div>
          
          <div className="space-y-4 flex-1">
            {memberProjects.length > 0 ? (
              memberProjects.map(project => {
                const completedInProject = memberTasks.filter(t => t.projectId === project.id && t.status === 'Done').length;
                const pendingInProject = memberTasks.filter(t => t.projectId === project.id && t.status !== 'Done').length;
                
                return (
                  <div 
                    key={project.id} 
                    onClick={() => triggerProjectTransition({ id: project.id, name: project.name })}
                    className="flex flex-col p-4 bg-gray-50 dark:bg-[#191919] rounded-lg border border-gray-100 dark:border-[#2C2C2C] hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {project.name}
                      </h4>
                      <span className={`w-2 h-2 rounded-full ${project.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{pendingInProject} pending</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Check className="w-3.5 h-3.5" />
                        <span>{completedInProject} completed</span>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg">
                <p className="text-xs text-gray-500">You are not part of any active projects.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
        <div className="xl:col-span-1">
          <RecentNotifications />
        </div>
        <div className="xl:col-span-2">
          <ActivitySection />
        </div>
      </div>
    </div>
  );
}

