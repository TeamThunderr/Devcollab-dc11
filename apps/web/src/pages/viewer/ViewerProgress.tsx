import React from "react";
import { useStore, toFrontendStatus } from "../../store/useStore";
import { TrendingUp, Award, BarChart3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface ViewerProgressProps {
  projectId?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Ongoing";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export function ViewerProgress({ projectId: propsId }: ViewerProgressProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const navigate = useNavigate();
  const tasks = useStore(state => state.tasks);
  const sprints = useStore(state => state.sprints || []);

  const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId));
  const doneTasks = projectTasks.filter(t => toFrontendStatus(t.status) === "Done");
  const inProgressTasks = projectTasks.filter(t => toFrontendStatus(t.status) === "In Progress");
  const todoTasks = projectTasks.filter(t => toFrontendStatus(t.status) === "To Do" || toFrontendStatus(t.status) === "In Review");

  const total = projectTasks.length || 1;
  const donePct = Math.round((doneTasks.length / total) * 100);
  const inProgressPct = Math.round((inProgressTasks.length / total) * 100);
  const todoPct = 100 - donePct - inProgressPct;

  const projectSprints = sprints.filter((s: any) => String(s.projectId) === String(projectId));
  
  // If sprints exist, show sprint progress. Otherwise derive milestone progress from real project tasks so there are no empty gaps!
  const milestones = projectSprints.length > 0 
    ? projectSprints.map((s: any) => {
        const sTasks = projectTasks.filter(t => t.sprintId === s.id);
        const sDone = sTasks.filter(t => toFrontendStatus(t.status) === "Done");
        const pct = sTasks.length > 0 ? Math.round((sDone.length / sTasks.length) * 100) : 0;
        return {
          name: s.name,
          status: s.status === 'COMPLETED' ? "Completed" : s.status === 'ACTIVE' ? "In Progress" : "Planned",
          pct,
          date: formatDate(s.endDate)
        };
      })
    : projectTasks.map((t: any) => {
        const st = toFrontendStatus(t.status);
        const isDone = st === "Done";
        const isProg = st === "In Progress";
        return {
          name: t.title,
          status: st,
          pct: isDone ? 100 : isProg ? 50 : 0,
          date: formatDate(t.dueDate || t.createdAt)
        };
      });

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Progress
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track task completion status for this project.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/timeline`)}
            className="px-4 py-2.5 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm flex items-center gap-2"
          >
            View Timeline →
          </button>
        </div>
      </div>

      {/* Deliverable Ratio Bar */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              Completion Ratio
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">{projectTasks.length} tasks across this project.</p>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projectTasks.length > 0 ? `${donePct}%` : "0%"} Completed</span>
        </div>

        {/* Ratio bar */}
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-[#2C2C2C] flex overflow-hidden gap-0.5">
          {projectTasks.length > 0 ? (
            <>
              <div className="bg-gray-900 dark:bg-white h-full transition-all duration-500" style={{ width: `${donePct}%` }} title={`Completed: ${donePct}%`} />
              <div className="bg-gray-500 dark:bg-gray-400 h-full transition-all duration-500" style={{ width: `${inProgressPct}%` }} title={`In Progress: ${inProgressPct}%`} />
              <div className="bg-gray-300 dark:bg-gray-600 h-full transition-all duration-500" style={{ width: `${todoPct}%` }} title={`Remaining: ${todoPct}%`} />
            </>
          ) : null}
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-[#2C2C2C]">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-white shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{doneTasks.length} Completed</span>
              <span className="text-[10px] text-gray-500">{projectTasks.length > 0 ? `${donePct}% of total` : "0%"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-500 dark:bg-gray-400 shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{inProgressTasks.length} In Progress</span>
              <span className="text-[10px] text-gray-500">{projectTasks.length > 0 ? `${inProgressPct}% of total` : "0%"}</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{todoTasks.length} Remaining</span>
              <span className="text-[10px] text-gray-500">{projectTasks.length > 0 ? `${todoPct}% of total` : "0%"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable & Milestone Progress */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            Milestones
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Current progress across milestones and tasks.</p>
        </div>

        <div className="space-y-4">
          {milestones.length === 0 ? (
            <div className="p-8 rounded-lg border border-dashed border-gray-200 dark:border-[#2C2C2C] text-center text-gray-500 text-sm">
              No milestones for this project yet.
            </div>
          ) : (
            milestones.map((ms: any, i: number) => (
              <div key={i} className="p-5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded text-[10px] font-semibold uppercase border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300">
                      {ms.status}
                    </span>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">{ms.name}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500">Target: {ms.date}</span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-600 dark:text-gray-400">Completion</span>
                    <span className="text-gray-900 dark:text-white font-semibold">{ms.pct}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#2C2C2C] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gray-900 dark:bg-white" 
                      style={{ width: `${ms.pct}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
