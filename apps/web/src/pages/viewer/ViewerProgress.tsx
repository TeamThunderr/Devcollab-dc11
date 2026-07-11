import React from "react";
import { useStore } from "../../store/useStore";
import { TrendingUp, Award, BarChart3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface ViewerProgressProps {
  projectId?: string;
}

export function ViewerProgress({ projectId: propsId }: ViewerProgressProps = {}) {
  const { projectId: routeId } = useParams();
  const projectId = propsId || routeId || 'p1';
  const navigate = useNavigate();
  const tasks = useStore(state => state.tasks);

  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const doneTasks = projectTasks.filter(t => t.status === "Done");
  const inProgressTasks = projectTasks.filter(t => t.status === "In Progress");
  const todoTasks = projectTasks.filter(t => t.status === "To Do" || t.status === "In Review");

  const total = projectTasks.length || 1;
  const donePct = Math.round((doneTasks.length / total) * 100);
  const inProgressPct = Math.round((inProgressTasks.length / total) * 100);
  const todoPct = 100 - donePct - inProgressPct;

  const milestones = [
    { name: "Sprint 11: Core Infrastructure & API Foundation", status: "Completed", pct: 100, date: "June 15" },
    { name: "Sprint 12: Role-Based Workspaces & UX Polish", status: "In Progress", pct: 85, date: "July 10" },
    { name: "Sprint 13: Advanced Analytics & AI Automation", status: "Planned", pct: 0, date: "July 30" },
  ];

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Project Visibility • Progress Report
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Milestone & Deliverable Progress
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Read-only breakdown of sprint execution ratios, deliverable completion rates, and upcoming targets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/timeline`)}
            className="px-4 py-2.5 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm flex items-center gap-2"
          >
            View Roadmap Timeline →
          </button>
        </div>
      </div>

      {/* Deliverable Ratio Bar */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Breakdown</div>
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              Overall Task Ratio
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Distribution of all {projectTasks.length} deliverables in this project.</p>
          </div>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{donePct}% Completed</span>
        </div>

        {/* Monochrome ratio bar */}
        <div className="w-full h-3 rounded-full bg-gray-100 dark:bg-[#2C2C2C] flex overflow-hidden gap-0.5">
          <div className="bg-gray-900 dark:bg-white h-full transition-all duration-500" style={{ width: `${donePct}%` }} title={`Completed: ${donePct}%`} />
          <div className="bg-gray-500 dark:bg-gray-400 h-full transition-all duration-500" style={{ width: `${inProgressPct}%` }} title={`In Progress: ${inProgressPct}%`} />
          <div className="bg-gray-300 dark:bg-gray-600 h-full transition-all duration-500" style={{ width: `${todoPct}%` }} title={`Remaining: ${todoPct}%`} />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-200 dark:border-[#2C2C2C]">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-900 dark:bg-white shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{doneTasks.length} Completed</span>
              <span className="text-[10px] text-gray-500">{donePct}% of total</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-500 dark:bg-gray-400 shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{inProgressTasks.length} In Progress</span>
              <span className="text-[10px] text-gray-500">{inProgressPct}% of total</span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600 shrink-0"></div>
            <div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white block">{todoTasks.length} Remaining</span>
              <span className="text-[10px] text-gray-500">{todoPct}% of total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint Milestone Progress */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
        <div className="border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
          <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Roadmap</div>
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5 flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-700 dark:text-gray-300" />
            Sprint Milestone Roadmap
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Track deliverable targets across development cycles.</p>
        </div>

        <div className="space-y-4">
          {milestones.map((ms, i) => (
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
          ))}
        </div>
      </div>
    </div>
  );
}
