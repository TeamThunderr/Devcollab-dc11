import React from "react";
import { useStore } from "../../store/useStore";
import { AtSign, MessageSquare, Activity, User, Clock, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

interface MemberCollaborationProps {
  projectId?: string;
}

export function MemberCollaboration({ projectId: propsId }: MemberCollaborationProps = {}) {
  const { projectId: routeId } = useParams();
  const projects = useStore(state => state.projects);
  const activeProject = projects.find(p => String(p.id) === String(routeId || propsId)) || projects[0];
  const projectId = propsId || routeId || activeProject?.id;
  const navigate = useNavigate();
  const activities = useStore(state => state.activities);

  const projectActivities = activities.filter(a => String(a.projectId) === String(projectId)).slice(0, 10);

  const mentions = projectActivities.filter(a => a.action?.toLowerCase().includes("mention") || a.action?.toLowerCase().includes("assign")).map(a => ({
    id: a.id,
    author: "Team Member",
    time: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : "Recently",
    text: a.action,
    type: a.action?.toLowerCase().includes("assign") ? "assign" : "mention"
  }));

  const discussions = projectActivities.filter(a => a.action?.toLowerCase().includes("comment") || a.action?.toLowerCase().includes("discuss")).slice(0, 5).map((a, idx) => ({
    id: a.id || idx,
    title: a.action,
    replies: 1,
    lastActive: a.timestamp ? new Date(a.timestamp).toLocaleDateString() : "Recently",
    status: "Open"
  }));

  return (
    <div className="space-y-10 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <AtSign className="w-3.5 h-3.5" />
            My Work • Team Communication
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Collaboration & Mentions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Stay aligned with your engineering team through live discussions, PR reviews, and direct mentions.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate(`/projects/${projectId}/chat`)}
            className="px-5 py-2.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs shadow-sm transition-opacity hover:opacity-90 flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            Open Team Chat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Direct Mentions & PR Notifications */}
        <div className="lg:col-span-7 space-y-8">
          <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Mentions</div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Direct Mentions & Assignments</h2>
              </div>
              <span className="px-2 py-0.5 rounded border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-[10px] font-semibold">
                {mentions.length} New
              </span>
            </div>

            <div className="space-y-3">
              {mentions.length === 0 ? (
                <div className="p-6 rounded-md border border-dashed border-gray-200 dark:border-[#2C2C2C] text-center text-gray-500 text-xs">
                  No direct mentions or assignments logged in this project yet.
                </div>
              ) : (
                mentions.map(item => (
                  <div key={item.id} className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-500" /> {item.author}
                      </span>
                      <span className="text-[11px] text-gray-400">{item.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed bg-white dark:bg-[#191919] p-3 rounded-md border border-gray-200 dark:border-[#2C2C2C] font-medium">
                      {item.text}
                    </p>
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button 
                        onClick={() => navigate(`/projects/${projectId}/chat`)}
                        className="text-[11px] font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                      >
                        Reply in Chat <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Engineering Discussions */}
          <div className="bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
              <div>
                <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Discussions</div>
                <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Active Threads</h2>
              </div>
              <button 
                onClick={() => navigate(`/projects/${projectId}/chat`)}
                className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Start Thread →
              </button>
            </div>

            <div className="space-y-3">
              {discussions.length === 0 ? (
                <div className="p-6 rounded-md border border-dashed border-gray-200 dark:border-[#2C2C2C] text-center text-gray-500 text-xs">
                  No active discussion threads yet. Click Start Thread to open one in chat.
                </div>
              ) : (
                discussions.map(disc => (
                  <div
                    key={disc.id}
                    onClick={() => navigate(`/projects/${projectId}/chat`)}
                    className="p-4 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-all cursor-pointer flex items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white block truncate group-hover:underline transition-all">
                        {disc.title}
                      </span>
                      <span className="text-[11px] text-gray-500 flex items-center gap-2">
                        <span>{disc.replies} replies</span> • <span>Last active {disc.lastActive}</span>
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0 border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] text-gray-700 dark:text-gray-300">
                      {disc.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Team Activity Feed */}
        <div className="lg:col-span-5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
            <div>
              <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Feed</div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mt-0.5">Live Activity</h2>
            </div>
            <button
              onClick={() => navigate(`/projects/${projectId}/activity`)}
              className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              View All →
            </button>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {projectActivities.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">No recent activity recorded.</div>
            ) : (
              projectActivities.map(act => (
                <div key={act.id} className="flex items-start gap-3 text-xs border-b border-gray-200 dark:border-[#2C2C2C]/60 pb-3.5 last:border-0 last:pb-0">
                  <div className="w-2 h-2 rounded-full bg-black dark:bg-white mt-1.5 shrink-0"></div>
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 leading-snug">
                      <span className="font-semibold text-gray-900 dark:text-white">User</span> {act.action}
                    </p>
                    <span className="text-[10px] text-gray-400 block flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {new Date(act.timestamp || act.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
