import React from "react";
import { useStore, toFrontendStatus } from "../../store/useStore";
import { useAuth } from "../../context/AuthContext";
import { 
  CheckCircle2, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  TrendingUp,
  ExternalLink,
  Folder,
  Activity,
  Info,
  Calendar,
  Flag,
  ShieldAlert,
  Layers
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewerDashboardProps {
  projectId?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Not scheduled";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

const formatElapsed = (isoString?: string) => {
  if (!isoString) return "Recent";
  try {
    const diff = Date.now() - new Date(isoString).getTime();
    if (isNaN(diff) || diff < 0) return formatDate(isoString);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days <= 7) return `${days}d ago`;
    return formatDate(isoString);
  } catch {
    return "Recent";
  }
};

export function ViewerDashboard({ projectId: propProjectId }: ViewerDashboardProps = {}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const projects = useStore(state => state.projects || []);
  const tasks = useStore(state => state.tasks || []);
  const members = useStore(state => state.members || []);
  const activities = useStore(state => state.activities || []);
  const sprints = useStore(state => state.sprints || []);

  const project = propProjectId ? projects.find(p => String(p.id) === String(propProjectId)) : undefined;
  const isWorkspaceOverview = !propProjectId || !project;

  const tasksToDisplay = isWorkspaceOverview
    ? tasks
    : tasks.filter(t => String(t.projectId) === String(project?.id));

  const activitiesToDisplay = React.useMemo(() => {
    const filtered = isWorkspaceOverview
      ? activities
      : activities.filter((a: any) => String(a.projectId) === String(project?.id));
    return [...filtered].sort((a: any, b: any) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
  }, [activities, isWorkspaceOverview, project]);

  const projectSprints = React.useMemo(() => {
    if (isWorkspaceOverview || !project) return sprints;
    return sprints.filter((s: any) => String(s.projectId) === String(project.id));
  }, [sprints, isWorkspaceOverview, project]);

  const doneTasks = tasksToDisplay.filter(t => {
    const s = toFrontendStatus(t.status);
    return s === "Done" || t.status === "DONE" || t.status === "Done";
  });
  const inProgressTasks = tasksToDisplay.filter(t => {
    const s = toFrontendStatus(t.status);
    return s === "In Progress" || t.status === "IN_PROGRESS" || t.status === "In Progress";
  });
  const reviewTasks = tasksToDisplay.filter(t => {
    const s = toFrontendStatus(t.status);
    return s === "In Review" || t.status === "IN_REVIEW" || t.status === "Review";
  });
  const todoTasks = tasksToDisplay.filter(t => {
    const s = toFrontendStatus(t.status);
    return s === "To Do" || t.status === "TO_DO" || t.status === "To Do";
  });

  const totalTasks = tasksToDisplay.length;
  const doneCount = doneTasks.length;
  const completionRate = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;
  const inProgressAndReviewCount = inProgressTasks.length + reviewTasks.length;

  // Real priority counts strictly from live tasks
  const urgentTasks = tasksToDisplay.filter(t => t.priority === "P0" || t.priority === "Urgent");
  const highTasks = tasksToDisplay.filter(t => t.priority === "P1" || t.priority === "High");
  const normalTasks = tasksToDisplay.filter(t => t.priority === "P2" || t.priority === "Medium" || !t.priority || t.priority === "Normal");
  const lowTasks = tasksToDisplay.filter(t => t.priority === "P3" || t.priority === "Low");
  const urgentOrHighTasks = [...urgentTasks, ...highTasks];

  const greetingName = currentUser?.name || "Viewer";

  return (
    <div className="space-y-6 pb-12 w-full max-w-7xl mx-auto pt-2">
      {/* 1. COMPACT TOP HEADER BAND */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-200 dark:border-[#2C2C2C] pb-5">
        <div>
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-1">
            {isWorkspaceOverview ? "Overview" : project?.name}
          </span>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight leading-none mb-2">
            {isWorkspaceOverview ? `Welcome, ${greetingName}` : project?.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 flex-wrap">
            <span>{isWorkspaceOverview ? `${projects.length} project${projects.length === 1 ? "" : "s"}` : `${tasksToDisplay.length} tasks`}</span>
            <span>·</span>
            <span className="font-semibold text-gray-900 dark:text-gray-200">Read-only</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {!isWorkspaceOverview && project ? (
            <>
              <button 
                onClick={() => navigate(`/projects/${project.id}/board`)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
              >
                Board <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => navigate(`/projects/${project.id}/wiki`)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#191919] transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" /> Wiki
              </button>
              <button 
                onClick={() => navigate(`/projects/${project.id}/timeline`)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#111] text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#191919] transition-all"
              >
                <Layers className="w-3.5 h-3.5" /> Timeline
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-300">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Read-only access
            </div>
          )}
        </div>
      </div>

      {/* 2. DISTINCT TOP EXECUTIVE METRICS STRIP (4 Key KPIs without repeating lists below) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Progress</span>
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono mb-1.5">{completionRate}%</div>
            <div className="w-full bg-gray-100 dark:bg-[#191919] h-1.5 rounded-full overflow-hidden">
              <div className="bg-gray-900 dark:bg-white h-full transition-all duration-500" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{doneCount} of {totalTasks} tasks completed</span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">In Progress & Review</span>
            <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{inProgressAndReviewCount}</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#191919] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2C2C2C]">Active</span>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{inProgressTasks.length} in progress · {reviewTasks.length} in review</span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">High Priority</span>
            <ShieldAlert className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{urgentOrHighTasks.length}</span>
            {urgentTasks.length > 0 && (
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">{urgentTasks.length} P0 Urgent</span>
            )}
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">Urgent & High tasks</span>
        </div>

        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-4 shadow-sm flex flex-col justify-between space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{isWorkspaceOverview ? "Projects" : "Sprints"}</span>
            {isWorkspaceOverview ? <Folder className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <Flag className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">{isWorkspaceOverview ? projects.length : projectSprints.length}</span>
            <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#191919] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#2C2C2C]">Active</span>
          </div>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">{isWorkspaceOverview ? `${totalTasks} tasks tracked` : `Target: ${formatDate((project as any)?.endDate || project?.createdAt)}`}</span>
        </div>
      </div>

      {/* 3. ROW 1: Consolidated Repository Directory / Specifications & Priority Breakdown with Live Deliverables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch w-full">
        {/* Card 1 (Left): Project Specifications / Workspace Directory (100% Live Data Only) */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2C2C2C] pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Info className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                {isWorkspaceOverview ? "Projects" : "Project Details"}
              </h3>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#191919] text-gray-700 dark:text-gray-300">
                {isWorkspaceOverview ? `${projects.length} Projects` : "Read-only"}
              </span>
            </div>

            {isWorkspaceOverview ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Select any project to view its status and tasks.
                </p>
                <div className="space-y-2.5">
                  {projects.slice(0, 5).map(p => {
                    const pTasks = tasks.filter(t => String(t.projectId) === String(p.id));
                    const pDone = pTasks.filter(t => toFrontendStatus(t.status) === "Done").length;
                    return (
                      <div
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}/overview`)}
                        className="flex items-center justify-between p-3.5 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] hover:border-gray-400 dark:hover:border-[#444] transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3 truncate mr-2">
                          <Folder className="w-4 h-4 text-gray-500 shrink-0" />
                          <div className="truncate">
                            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block truncate">{p.name}</span>
                            <span className="text-[11px] text-gray-500">Created {formatDate(p.createdAt)} · {pDone}/{pTasks.length} done</span>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-white dark:bg-[#2C2C2C] border border-gray-200 dark:border-[#3C3C3C] text-gray-700 dark:text-gray-300 shrink-0">
                          {pTasks.length === 0 ? "0 tasks" : `${Math.round((pDone / pTasks.length) * 100)}%`}
                        </span>
                      </div>
                    );
                  })}
                  {projects.length === 0 && (
                    <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg">
                      No projects in this workspace yet.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {project?.description || (project as any)?.goal || "No description provided."}
                </p>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" /> Created Date
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 block">
                      {formatDate(project?.createdAt)}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                    <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Target Date
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 block">
                      {formatDate((project as any)?.endDate)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">Task Status</span>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">{doneCount}</span>
                      <span className="text-[10px] text-gray-500">Done</span>
                    </div>
                    <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">{inProgressTasks.length}</span>
                      <span className="text-[10px] text-gray-500">In Progress</span>
                    </div>
                    <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                      <span className="font-bold text-gray-900 dark:text-gray-100 block">{reviewTasks.length + todoTasks.length}</span>
                      <span className="text-[10px] text-gray-500">Review / To Do</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#2C2C2C] flex items-center justify-between text-xs text-gray-500">
            <span>Live task data</span>
            {!isWorkspaceOverview && project && (
              <button
                onClick={() => navigate(`/projects/${project.id}/board`)}
                className="font-semibold text-gray-900 dark:text-white hover:underline flex items-center gap-1"
              >
                View Board <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2 (Right): Priority Breakdown & Active Deliverables Spotlight (100% Live Data Only) */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2C2C2C] pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                Tasks by Priority
              </h3>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#191919] text-gray-700 dark:text-gray-300">
                {totalTasks} Total
              </span>
            </div>

            {/* 4-Tier Live Priority Matrix */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">P0 Urgent</span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{urgentTasks.length}</span>
              </div>
              <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">P1 High</span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{highTasks.length}</span>
              </div>
              <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">P2 Normal</span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{normalTasks.length}</span>
              </div>
              <div className="p-2 rounded bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C]">
                <span className="text-[10px] font-semibold text-gray-400 block uppercase">P3 Low</span>
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">{lowTasks.length}</span>
              </div>
            </div>

            {/* Live Backlog Deliverables List */}
            <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-[#2C2C2C]">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                <span>Recent Tasks</span>
                <span>Status</span>
              </div>
              <div className="space-y-2 text-sm">
                {tasksToDisplay.slice(0, 4).map(task => {
                  const statusLabel = toFrontendStatus(task.status);
                  const isDone = statusLabel === "Done";
                  return (
                    <div 
                      key={task.id}
                      onClick={() => !isWorkspaceOverview && navigate(`/projects/${task.projectId}/board`)}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] hover:border-gray-400 dark:hover:border-[#444] transition-all cursor-pointer"
                    >
                      <div className="truncate mr-3">
                        <span className="font-medium text-gray-900 dark:text-gray-100 block truncate">{task.title}</span>
                        <span className="text-xs text-gray-500">
                          Priority: {task.priority || "Normal"} · Assignee: {task.assigneeId ? (members.find(m => String(m.id) === String(task.assigneeId))?.name || "Assigned") : "Unassigned"}
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-gray-200 dark:border-[#3C3C3C] shrink-0 ${
                        isDone ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-white dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300"
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })}
                {tasksToDisplay.length === 0 && (
                  <div className="p-6 text-center text-xs text-gray-500 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg">
                    No tasks across your projects yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#2C2C2C] flex items-center justify-between text-xs text-gray-500">
            <span>Live task data</span>
            {!isWorkspaceOverview && project && (
              <button
                onClick={() => navigate(`/projects/${project.id}/board`)}
                className="font-semibold text-gray-900 dark:text-white hover:underline flex items-center gap-1"
              >
                View Board <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. ROW 2: Roadmap Sprints & Execution Timeline + Recent Activity Feed (100% Live Data Only, Zero Mock Data) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch w-full">
        {/* Card 3 (Left): Roadmap Sprints & Execution Timeline (Strictly Live Sprints Only!) */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2C2C2C] pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                Sprints & Timeline
              </h3>
              <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#191919] text-gray-700 dark:text-gray-300">
                {projectSprints.length} Sprints
              </span>
            </div>

            {projectSprints && projectSprints.length > 0 ? (
              <div className="space-y-3.5">
                {projectSprints.slice(0, 4).map((s: any) => {
                  const sTasks = tasksToDisplay.filter(t => String((t as any).sprintId) === String(s.id));
                  const sDone = sTasks.filter(t => toFrontendStatus(t.status) === "Done").length;
                  const pct = sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : (s.status === "completed" ? 100 : 0);
                  return (
                    <div key={s.id} className="p-3.5 rounded-lg bg-gray-50 dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 block truncate mr-2">
                          {s.name || "Engineering Sprint"}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold border border-gray-200 dark:border-[#3C3C3C] bg-white dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 shrink-0">
                          {s.status || (pct === 100 ? "Completed" : "Active")}
                        </span>
                      </div>
                      {s.goal && <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{s.goal}</p>}
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 dark:bg-[#2C2C2C] h-1.5 rounded-full overflow-hidden">
                          <div className="bg-gray-900 dark:bg-white h-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span>{formatDate(s.startDate || s.createdAt)} — {formatDate(s.endDate)}</span>
                          <span className="font-mono">{pct}% ({sTasks.length} tasks)</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg flex flex-col items-center justify-center space-y-3 my-4">
                <Flag className="w-6 h-6 text-gray-400 stroke-[1.5]" />
                <div className="max-w-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-300 block mb-1">No Sprints Scheduled</span>
                  <span>Sprint progress will display here when scheduled.</span>
                </div>
                {!isWorkspaceOverview && project && (
                  <button
                    onClick={() => navigate(`/projects/${project.id}/timeline`)}
                    className="mt-2 px-3 py-1.5 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-lg text-xs font-semibold hover:opacity-90 transition-all shadow-sm"
                  >
                    View Timeline
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#2C2C2C] flex items-center justify-between text-xs text-gray-500">
            <span>Calculated from task status</span>
            {!isWorkspaceOverview && project && (
              <button
                onClick={() => navigate(`/projects/${project.id}/timeline`)}
                className="font-semibold text-gray-900 dark:text-white hover:underline flex items-center gap-1"
              >
                View Timeline <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Card 4 (Right): Recent Activity Feed & Audit Ledger (Strictly Live Activities Only!) */}
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-xl p-6 shadow-sm flex flex-col justify-between h-full space-y-6">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2C2C2C] pb-3 mb-4">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                {isWorkspaceOverview ? "Recent Activity" : "Project Activity"}
              </h3>
              <span className="text-xs font-mono text-gray-500">Read-only</span>
            </div>

            <div className="relative border-l border-gray-200 dark:border-[#2C2C2C] ml-3 pl-5 space-y-4">
              {activitiesToDisplay.length > 0 ? (
                activitiesToDisplay.slice(0, 5).map((act: any) => {
                  const member = members.find(m => String(m.id) === String(act.userId));
                  return (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[25px] top-1.5 w-2.5 h-2.5 rounded-full bg-gray-900 dark:bg-white border-2 border-white dark:border-[#111]"></div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300 leading-snug">
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{member?.name || "System"}</span>{" "}
                          {act.action || act.actionType || "updated workspace state"}
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap shrink-0">{formatElapsed(act.createdAt || act.timestamp)}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-gray-500 border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-lg -ml-5 flex flex-col items-center justify-center space-y-2">
                  <Activity className="w-6 h-6 text-gray-400 stroke-[1.5]" />
                  <span>No recent activity.</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-[#2C2C2C] flex items-center justify-between text-xs text-gray-500">
            <span>Live activity</span>
            {!isWorkspaceOverview && project && (
              <button
                onClick={() => navigate(`/projects/${project.id}/wiki`)}
                className="font-semibold text-gray-900 dark:text-white hover:underline flex items-center gap-1"
              >
                View Wiki <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
