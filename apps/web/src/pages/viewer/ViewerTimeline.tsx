import React from "react";
import { useStore, toFrontendStatus } from "../../store/useStore";
import { Award, CheckCircle2, Clock, Flag } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface ViewerTimelineProps {
  projectId?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Recent";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export function ViewerTimeline({ projectId: propsId }: ViewerTimelineProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const navigate = useNavigate();
  const tasks = useStore(state => state.tasks);
  const sprints = useStore(state => state.sprints || []);

  const projectSprints = sprints.filter((s: any) => String(s.projectId) === String(projectId));
  const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId));

  // If sprints exist, use them. If not, derive chronological events from real project tasks so there is no empty gap!
  const timelineEvents = projectSprints.length > 0
    ? projectSprints.map((s: any) => ({
        quarter: formatDate(s.startDate || s.createdAt),
        title: s.name,
        date: `${formatDate(s.startDate)} - ${formatDate(s.endDate)}`,
        status: s.status === 'COMPLETED' ? 'Completed' : s.status === 'ACTIVE' ? 'In Progress' : 'Planned',
        description: s.goal || "Sprint deliverables and tasks.",
        highlights: ["Sprint tasks and milestones tracked inside project board."]
      }))
    : projectTasks.map((t: any) => {
        const st = toFrontendStatus(t.status);
        const isDone = st === "Done";
        return {
          quarter: formatDate(t.createdAt || t.dueDate),
          title: t.title,
          date: t.dueDate ? `Due ${formatDate(t.dueDate)}` : `Created ${formatDate(t.createdAt)}`,
          status: isDone ? 'Completed' : st === 'In Progress' ? 'In Progress' : 'Planned',
          description: t.description || "Task deliverable and execution details.",
          highlights: [`Priority: ${t.priority || "Normal"}`, `Status: ${st}`]
        };
      });

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Chronological record of project milestones and tasks.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/progress`)}
            className="px-4 py-2.5 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm flex items-center gap-2"
          >
            View Progress →
          </button>
        </div>
      </div>

      {/* Chronological Timeline */}
      <div className="relative border-l-2 border-gray-200 dark:border-[#2C2C2C] ml-4 md:ml-8 space-y-12 pl-6 md:pl-10">
        {timelineEvents.length === 0 ? (
          <div className="p-8 rounded-lg border border-dashed border-gray-200 dark:border-[#2C2C2C] text-center text-gray-500 text-sm">
            No timeline events for this project yet.
          </div>
        ) : (
          timelineEvents.map((ev: any, i: number) => (
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
                  <span className="text-xs font-semibold text-gray-900 dark:text-white block">Deliverable Details:</span>
                  <ul className="space-y-1.5">
                    {ev.highlights.map((hl: string, j: number) => (
                      <li key={j} className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-900 dark:bg-white shrink-0"></div>
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
