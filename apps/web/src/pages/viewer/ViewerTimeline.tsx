import React from "react";
import { useStore } from "../../store/useStore";
import { Award, CheckCircle2, Clock, Flag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface ViewerTimelineProps {
  projectId?: string;
}

export function ViewerTimeline({ projectId: propsId }: ViewerTimelineProps = {}) {
  const { projectId: routeId } = useParams();
  const projectId = propsId || routeId || 'p1';
  const navigate = useNavigate();

  const timelineEvents = [
    {
      quarter: "Q3 2026 • Current Sprint",
      title: "Sprint 12: Role-Based Workspaces & Portal Polish",
      date: "July 1 - July 15",
      status: "In Progress",
      description: "Implementing three independent role-specific workspaces (Admin, Member, Viewer) with distinct navigation hierarchies and deconstructed information architectures.",
      highlights: [
        "Member Developer Workspace with one-click task transitions & snippet scratchpad",
        "Viewer Status Portal with read-only deliverable ratio tracking",
        "Dynamic sidebar hierarchy adaptation in ProjectLayout"
      ]
    },
    {
      quarter: "Q2 2026 • Completed",
      title: "Sprint 11: Core API & JWT Authentication Suite",
      date: "June 15 - June 30",
      status: "Completed",
      description: "Built the underlying secure authentication layer, RBAC capabilities matrix, and Zustand state store synchronization.",
      highlights: [
        "Secure JWT token rotation and session management",
        "Zustand store with simulated Socket.IO real-time activity feed",
        "Framer Motion UI transitions and dark mode theme system"
      ]
    },
    {
      quarter: "Q2 2026 • Completed",
      title: "Sprint 10: Initial Project Layout & Kanban Board",
      date: "June 1 - June 14",
      status: "Completed",
      description: "Established the foundational React + TypeScript workspace architecture and responsive dashboard layout.",
      highlights: [
        "Drag-and-drop Kanban board with priority filtering",
        "Collaborative Wiki documentation editor",
        "Code snippet library with syntax highlighting"
      ]
    },
    {
      quarter: "Q3 2026 • Upcoming Roadmap",
      title: "Sprint 13: AI Engineering Copilot & Automated Refactoring",
      date: "July 16 - July 31",
      status: "Planned",
      description: "Integrating LLM-powered automated code reviews, snippet refactoring, and predictive workload velocity analytics.",
      highlights: [
        "AI Assistant code generation directly from Kanban task descriptions",
        "Automated PR review summaries and risk radar alerts",
        "Real-time team velocity forecasting"
      ]
    }
  ];

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Award className="w-3.5 h-3.5" />
            Project Roadmap • Chronological Timeline
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Release Roadmap & Milestones
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chronological overview of past engineering deliverables, active sprint goals, and upcoming quarterly targets.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/progress`)}
            className="px-4 py-2.5 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm flex items-center gap-2"
          >
            Check Progress Ratios →
          </button>
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="relative border-l-2 border-gray-200 dark:border-[#2C2C2C] ml-4 md:ml-8 space-y-12 pl-6 md:pl-10">
        {timelineEvents.map((ev, i) => (
          <div key={i} className="relative group">
            {/* Timeline dot */}
            <div className={`absolute -left-[31px] md:-left-[47px] top-1.5 w-6 h-6 rounded-full border-4 border-white dark:border-[#0f0f0f] flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 ${
              ev.status === "Completed" ? "bg-black dark:bg-white text-white dark:text-black" :
              ev.status === "In Progress" ? "bg-gray-700 dark:bg-gray-300 text-white dark:text-black" :
              "bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            }`}>
              {ev.status === "Completed" && <CheckCircle2 className="w-3 h-3" />}
              {ev.status === "In Progress" && <Clock className="w-3 h-3" />}
              {ev.status === "Planned" && <Flag className="w-3 h-3" />}
            </div>

            <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm hover:shadow-md transition-all space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 border-b border-gray-200 dark:border-[#2C2C2C] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                    {ev.quarter}
                  </span>
                  <span className="text-gray-300 dark:text-[#2C2C2C]">•</span>
                  <span className="text-xs font-medium text-gray-500">{ev.date}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300">
                  {ev.status}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                  {ev.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
                  {ev.description}
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-gray-900 dark:text-white block">Key Deliverables & Highlights:</span>
                <ul className="space-y-1.5">
                  {ev.highlights.map((hl, j) => (
                    <li key={j} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white shrink-0"></div>
                      <span>{hl}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
