import React from "react";
import { useStore } from "../../store/useStore";
import { Code2, Clock, CheckCircle2, TerminalSquare, ArrowRight, GitPullRequest } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StatsGrid } from "../../components/dashboard/StatsGrid";
import { useRole } from "../../context/RBACContext";
import { useAuth } from "../../context/AuthContext";
import { toFrontendStatus } from "../../store/useStore";

interface MemberOverviewProps {
  projectId?: string;
}

export function MemberOverview({ projectId: propsId }: MemberOverviewProps = {}) {
  const { projectId: routeId } = useParams();
  const { currentUserId } = useRole();
  const { currentUser } = useAuth();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const navigate = useNavigate();
  const tasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);
  const snippets = useStore(state => state.snippets);

  const project = projects.find(p => String(p.id) === String(projectId)) || projects[0];
  const currentMember = members.find(m => String(m.id) === String(currentUserId) || Number(m.id) === Number(currentUserId) || (m.email && currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase())) || {
    id: currentUserId,
    name: currentUser?.name || 'Developer',
    email: currentUser?.email || '',
    role: 'Member' as const,
    joinedAt: new Date().toISOString(),
    avatarUrl: currentUser?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${currentUser?.name || 'dev'}`
  };

  const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId));
  const myTasks = projectTasks.filter(t => t.assigneeId && (String(t.assigneeId) === String(currentUserId) || Number(t.assigneeId) === Number(currentUserId)));
  
  const myInProgress = myTasks.filter(t => toFrontendStatus(t.status) === "In Progress");
  const dueToday = myTasks.filter(t => t.dueDate === "Today" || t.priority === "P0");
  const myDone = myTasks.filter(t => toFrontendStatus(t.status) === "Done");
  const completionRate = myTasks.length > 0 ? Math.round((myDone.length / myTasks.length) * 100) : 0;

  return (
    <div className="space-y-12 pb-16">
      {/* Monochrome Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between py-8 border-b border-gray-200 dark:border-[#2C2C2C] gap-4">
        <div>
          <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-1">
            Project Space · Developer Workspace
          </div>
          <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-gray-100 tracking-[-0.03em] leading-tight">
            Ready to build, {currentMember.name.split(" ")[0]}?
          </h1>
          <p className="text-gray-500 text-[0.9rem] mt-1">
            Welcome to your engineering environment for {project?.name}. Here is your sprint summary and immediate development priorities.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate(`/projects/${projectId}/editor`)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            <TerminalSquare className="w-4 h-4" />
            Launch VS Code IDE
          </button>
          <button 
            onClick={() => navigate(`/projects/${projectId}/tasks`)}
            className="px-4 py-2 border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-[#191919]/50 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            My Tasks ({myTasks.length})
          </button>
        </div>
      </div>

      {/* Reused StatsGrid Component */}
      <StatsGrid
        firstValue={`${myInProgress.length}`}
        firstLabel="Active Work in Sprint"
        secondValue={`${dueToday.length}`}
        secondLabel="Due Today / Priority"
        thirdValue={`${completionRate}%`}
        thirdLabel="Sprint Velocity Rate"
      />

      {/* Continue Working & Development Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Tasks Quick Jump */}
        <div className="lg:col-span-7 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
            <div>
              <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Active Development</div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Continue Working</h2>
              <p className="text-xs text-gray-500 mt-0.5">Jump straight into your active code branches and assigned deliverables.</p>
            </div>
            <button 
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              View All Tasks <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {myInProgress.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 dark:bg-[#191919]/40 rounded-md border border-dashed border-gray-200 dark:border-[#2C2C2C]">
              <CheckCircle2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No tasks currently In Progress</p>
              <button 
                onClick={() => navigate(`/projects/${projectId}/tasks`)}
                className="mt-3 px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black text-xs font-medium shadow-sm transition-opacity hover:opacity-90"
              >
                Grab a Task from My Tasks
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myInProgress.map(task => (
                <div key={task.id} className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{task.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-gray-200 dark:border-[#2C2C2C] bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 uppercase">
                        {task.priority || "P1"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" /> Due: {task.dueDate || "This Week"} • Status: In Progress
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/projects/${projectId}/editor`)}
                    className="px-4 py-2 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs shadow-sm transition-opacity hover:opacity-90 shrink-0 flex items-center gap-1.5"
                  >
                    <TerminalSquare className="w-3.5 h-3.5" /> Open Code
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Developer Quick Links & Library Status */}
        <div className="lg:col-span-5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Engineering Hub</div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">My Environment</h3>
              </div>
              <span className="text-xs font-medium px-2 py-0.5 rounded border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300">
                Ready
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/projects/${projectId}/workspace`)}
                className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-all text-left space-y-2 group"
              >
                <Code2 className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">My Workspace</div>
                  <div className="text-[10px] text-gray-500">{snippets.length} Snippets & Files</div>
                </div>
              </button>

              <button
                onClick={() => navigate(`/projects/${projectId}/collaboration`)}
                className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-all text-left space-y-2 group"
              >
                <GitPullRequest className="w-5 h-5 text-gray-700 dark:text-gray-300 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">Collaboration</div>
                  <div className="text-[10px] text-gray-500">Discussions & PRs</div>
                </div>
              </button>
            </div>
          </div>

          <div className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">AI Engineering Copilot</span>
              <span className="text-[11px] text-gray-500">Automated code reviews & snippet generation.</span>
            </div>
            <button 
              onClick={() => navigate(`/projects/${projectId}/ai`)}
              className="px-3.5 py-1.5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 font-medium text-xs shadow-sm transition-all shrink-0"
            >
              Ask AI
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
