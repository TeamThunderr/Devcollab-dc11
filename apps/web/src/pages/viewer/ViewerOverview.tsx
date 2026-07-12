import React from "react";
import { useStore, toFrontendStatus } from "../../store/useStore";
import { Award, TrendingUp, ArrowRight, Layers, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { StatsGrid } from "../../components/dashboard/StatsGrid";

interface ViewerOverviewProps {
  projectId?: string;
}

export function ViewerOverview({ projectId: propsId }: ViewerOverviewProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const navigate = useNavigate();
  const tasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);

  const project = projects.find(p => String(p.id) === String(projectId)) || projects[0];
  const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId));
  
  const completedTasks = projectTasks.filter(t => toFrontendStatus(t.status) === "Done");
  const inProgressTasks = projectTasks.filter(t => toFrontendStatus(t.status) === "In Progress");
  const completionRate = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0;

  return (
    <div className="space-y-12 pb-16">
      {/* Monochrome Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between py-8 border-b border-gray-200 dark:border-[#2C2C2C] gap-4">
        <div>
          <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-1">
            Project Space · Viewer Portal
          </div>
          <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-gray-100 tracking-[-0.03em] leading-tight">
            {project?.name} Status Overview
          </h1>
          <p className="text-gray-500 text-[0.9rem] mt-1">
            Welcome to the read-only project portal. Review deliverable completion, milestone roadmaps, and progress.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate(`/projects/${projectId}/progress`)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            Detailed Progress
          </button>
          <button 
            onClick={() => navigate(`/projects/${projectId}/timeline`)}
            className="px-4 py-2 border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-[#191919]/50 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Milestones
          </button>
        </div>
      </div>

      {/* Reused StatsGrid Component */}
      <StatsGrid
        firstValue={`${completionRate}%`}
        firstLabel="Deliverable Completion"
        secondValue={`${project?.status || "Active"}`}
        secondLabel="Overall System Status"
        thirdValue={`${members.length}`}
        thirdLabel="Active Contributors"
      />

      {/* Deliverables & Team Roster Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
            <div>
              <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Work Status</div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Current Deliverables</h2>
              <p className="text-xs text-gray-500 mt-0.5">High-level breakdown of active project deliverables.</p>
            </div>
            <button
              onClick={() => navigate(`/projects/${projectId}/progress`)}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              Full Progress Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">Completed Deliverables</span>
                <span className="text-[11px] text-gray-500">Fully tested and deployed to staging</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{completedTasks.length} Tasks</span>
            </div>

            <div className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">In Progress Deliverables</span>
                <span className="text-[11px] text-gray-500">Active engineering development in sprint</span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{inProgressTasks.length} Tasks</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Directory</div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Team Roster Preview</h2>
              </div>
              <button
                onClick={() => navigate(`/projects/${projectId}/team`)}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                View Roster →
              </button>
            </div>

            <div className="space-y-3">
              {members.slice(0, 3).map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-md border border-gray-200 dark:border-[#2C2C2C]">
                  <div className="flex items-center gap-3">
                    <img src={m.avatarUrl || undefined} alt={m.name} className="w-8 h-8 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-white" />
                    <div>
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 block">{m.name}</span>
                      <span className="text-[10px] text-gray-500">{m.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium uppercase border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 text-xs text-gray-700 dark:text-gray-300 flex items-center justify-between">
            <span>Looking for technical specs? Review the <button onClick={() => navigate(`/projects/${projectId}/wiki`)} className="font-semibold underline">Documentation</button>.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
