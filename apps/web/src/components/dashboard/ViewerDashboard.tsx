import React from "react";
import { useStore } from "../../store/useStore";
import { 
  Eye, 
  CheckCircle2, 
  Clock, 
  Users, 
  BookOpen, 
  Kanban, 
  Activity as ActivityIcon, 
  Target, 
  Calendar, 
  ShieldCheck, 
  ArrowRight, 
  Award, 
  TrendingUp 
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ViewerDashboardProps {
  projectId: string;
}

export function ViewerDashboard({ projectId }: ViewerDashboardProps) {
  const navigate = useNavigate();
  const projects = useStore(state => state.projects);
  const tasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);
  const activities = useStore(state => state.activities);

  const project = projects.find(p => p.id === projectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectMembers = Array.isArray(project?.members) && project.members.length > 0
    ? members.filter(m => project.members.includes(m.id))
    : members;

  const doneCount = projectTasks.filter(t => t.status === "Done").length;
  const totalTasks = projectTasks.length || 1;
  const completionRate = Math.round((doneCount / totalTasks) * 100);

  const milestones = [
    { title: "Sprint 12: Landing Page & Auth Overhaul", status: "In Progress", date: "Target: July 15, 2026", progress: completionRate, current: true },
    { title: "Sprint 11: Database Schema & API V1 Migration", status: "Completed", date: "Finished: June 30, 2026", progress: 100, current: false },
    { title: "Sprint 13: Mobile App V2 Public Beta Release", status: "Upcoming", date: "Target: August 1, 2026", progress: 0, current: false },
  ];

  return (
    <div className="space-y-10 pb-16">
      {/* Viewer Status Portal Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900/60 via-zinc-900/50 to-neutral-900/60 border border-gray-400/30 dark:border-zinc-700/50 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-gray-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-500/20 border border-gray-400/30 text-gray-300 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              Project Status Portal • Read-Only Viewer
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              {project?.name} Status Overview
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Explore high-level project milestones, track overall completion percentages, view the active engineering roster, and review documentation in read-only mode.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button 
              onClick={() => navigate(`/projects/${projectId}/board`)}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            >
              <Kanban className="w-4 h-4" />
              View Read-Only Board
            </button>
            <button 
              onClick={() => navigate(`/projects/${projectId}/wiki`)}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 font-medium text-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Read Documentation
            </button>
          </div>
        </div>
      </div>

      {/* Project Status & Completion Banner */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-800 pb-6 md:pb-0 md:pr-6">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">Current Status</span>
          <div className="flex items-center gap-3">
            <span className="flex h-3.5 w-3.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
            <span className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Active & On Schedule</span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            All primary engineering sprints are proceeding according to the Q3 development timeline.
          </p>
        </div>

        <div className="md:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              Overall Project Completion Rate
            </span>
            <span className="text-xl font-black text-blue-600 dark:text-blue-400 font-mono">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-zinc-800 h-3 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 h-full rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }}></div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <span>{doneCount} milestones completed out of {totalTasks} total tasks</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">Target Date: July 31, 2026</span>
          </div>
        </div>
      </div>

      {/* Milestones & Timeline Summary */}
      <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Project Milestones & Timeline Summary
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">High-level roadmaps and completed deliverables.</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
            Q3 Roadmap
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {milestones.map((ms, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-xl border flex flex-col justify-between gap-4 transition-all ${
                ms.current 
                  ? "bg-blue-500/5 border-blue-500/30 dark:border-blue-500/30 shadow-md ring-1 ring-blue-500/20" 
                  : "bg-gray-50/50 dark:bg-zinc-900/40 border-gray-200 dark:border-zinc-800"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                    ms.status === "Completed" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    ms.status === "In Progress" ? "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse" :
                    "bg-gray-500/10 text-gray-500 border-gray-500/20"
                  }`}>
                    {ms.status}
                  </span>
                  <span className="text-xs font-mono text-gray-400">{ms.date}</span>
                </div>
                <h3 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">{ms.title}</h3>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-gray-200/50 dark:border-zinc-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-500">Progress</span>
                  <span className="font-bold text-gray-900 dark:text-white">{ms.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${ms.progress}%` }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Roster & Read-Only Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Active Team Roster */}
        <div className="lg:col-span-6 bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                Active Engineering Team Roster
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Contributors assigned to {project?.name}.</p>
            </div>
            <button 
              onClick={() => navigate(`/projects/${projectId}/members`)}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View Roster <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {projectMembers.map(member => (
              <div key={member.id} className="p-3.5 rounded-xl border border-gray-100 dark:border-zinc-800/80 bg-gray-50/60 dark:bg-zinc-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={member.avatarUrl || undefined} alt={member.name} className="w-9 h-9 rounded-full border border-gray-200 dark:border-zinc-700 bg-white" />
                  <div>
                    <span className="text-sm font-bold text-gray-900 dark:text-white block">{member.name}</span>
                    <span className="text-xs text-gray-500">{member.email}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-200/80 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border border-gray-300/40 dark:border-zinc-700">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Read-Only Project Activity */}
        <div className="lg:col-span-6 bg-white dark:bg-[#191919] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ActivityIcon className="w-4 h-4 text-orange-500" />
                  Recent Project Highlights
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Read-only timeline of completed milestones.</p>
              </div>
              <button 
                onClick={() => navigate(`/projects/${projectId}/activity`)}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
              >
                View Timeline <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {activities.slice(0, 4).map((act) => {
                const member = members.find(m => m.id === act.userId);
                return (
                  <div key={act.id} className="p-3 rounded-lg bg-gray-50/50 dark:bg-zinc-900/40 border border-gray-100 dark:border-zinc-800/60 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <p className="truncate text-gray-700 dark:text-gray-300">
                        <span className="font-bold text-gray-900 dark:text-white">{member?.name || "Member"}</span> {act.action}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-400 shrink-0 font-mono">{act.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5 border border-blue-500/20 flex items-center justify-between gap-4 mt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-blue-500 shrink-0" />
              <div>
                <span className="text-xs font-bold text-gray-900 dark:text-white block">Project Documentation & Wiki</span>
                <span className="text-[11px] text-gray-500">Access architectural diagrams and API references.</span>
              </div>
            </div>
            <button 
              onClick={() => navigate(`/projects/${projectId}/wiki`)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all shrink-0"
            >
              Open Wiki
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
