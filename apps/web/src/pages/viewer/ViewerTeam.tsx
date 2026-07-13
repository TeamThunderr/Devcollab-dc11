import React from "react";
import { useStore } from "../../store/useStore";
import { Users, Mail, Calendar } from "lucide-react";
import { useParams } from "react-router-dom";

interface ViewerTeamProps {
  projectId?: string;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return "Recently";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return dateStr;
  }
};

export function ViewerTeam({ projectId: propsId }: ViewerTeamProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const tasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);

  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId));
  const projectId = propsId || routeId || activeProject?.id;
  const project = projectId ? projects.find(p => String(p.id) === String(projectId)) : undefined;

  const projectTasks = tasks.filter(t => !projectId || String(t.projectId) === String(projectId));

  // Display ONLY members assigned to this specific project (in project.members OR assigned to tasks).
  // If not inside a specific project, show all workspace members.
  const membersToDisplay = React.useMemo(() => {
    if (!project) return members;

    const assignedIds = new Set<string>();
    if (Array.isArray(project.members)) {
      project.members.forEach(id => assignedIds.add(String(id)));
    }
    projectTasks.forEach(task => {
      if (task.assigneeId) assignedIds.add(String(task.assigneeId));
    });
    return members.filter(m => assignedIds.has(String(m.id)));
  }, [members, project, projectTasks]);

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Clean Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Team
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Team members on this project.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3.5 py-1.5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 font-semibold text-xs">
            {membersToDisplay.length} {membersToDisplay.length === 1 ? "Member" : "Members"}
          </span>
        </div>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {membersToDisplay.map(member => (
          <div 
            key={member.id} 
            className="p-6 rounded-lg border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-6 group"
          >
            <div className="flex items-start gap-4">
              <img 
                src={member.avatarUrl || undefined} 
                alt={member.name} 
                className="w-14 h-14 rounded-lg bg-white border border-gray-200 dark:border-[#2C2C2C] shrink-0 object-cover" 
              />
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-base text-gray-900 dark:text-white truncate">
                    {member.name}
                  </h3>
                </div>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                  <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 dark:border-[#2C2C2C] flex items-center justify-between gap-2 text-xs">
              <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {formatDate(member.joinedAt)}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300">
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>

      {membersToDisplay.length === 0 && (
        <div className="p-12 text-center border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-xl bg-white dark:bg-[#191919] text-gray-500 text-sm">
          No team members assigned to this project yet.
        </div>
      )}
    </div>
  );
}
