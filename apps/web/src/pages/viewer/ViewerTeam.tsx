import React from "react";
import { useStore } from "../../store/useStore";
import { Users, Mail, Calendar } from "lucide-react";
import { useParams } from "react-router-dom";

interface ViewerTeamProps {
  projectId?: string;
}

export function ViewerTeam({ projectId: propsId }: ViewerTeamProps = {}) {
  const { projectId: routeId } = useParams();
  const projectId = propsId || routeId || 'p1';
  const members = useStore(state => state.members);
  const projects = useStore(state => state.projects);
  const project = projects.find(p => p.id === projectId) || projects[0];

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5" />
            People • Contributor Directory
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Team Roster & Roles
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Read-only directory of active engineering contributors, designers, and project stakeholders.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="px-3.5 py-1.5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 font-semibold text-xs">
            {members.length} Active Members
          </span>
        </div>
      </div>

      {/* Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map(member => (
          <div 
            key={member.id} 
            className="p-6 rounded-lg border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-6 group"
          >
            <div className="flex items-start gap-4">
              <img 
                src={member.avatarUrl || undefined} 
                alt={member.name} 
                className="w-14 h-14 rounded-lg bg-white border border-gray-200 dark:border-[#2C2C2C] shrink-0 transition-transform" 
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
              <span className="text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Joined {member.joinedAt}
              </span>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300">
                {member.role}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
