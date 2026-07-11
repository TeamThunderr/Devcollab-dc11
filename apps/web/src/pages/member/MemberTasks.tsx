import React, { useState } from "react";
import { useStore, TaskStatus } from "../../store/useStore";
import { CheckCircle2, Clock, Play, Check, GitPullRequest, CheckCheck, TerminalSquare } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { TaskModal } from "../../components/dashboard/TaskModal";
import { useRole } from "../../context/RBACContext";

interface MemberTasksProps {
  projectId?: string;
}

export function MemberTasks({ projectId: propsId }: MemberTasksProps = {}) {
  const { projectId: routeId } = useParams();
  const projectId = propsId || routeId || 'p1';
  const navigate = useNavigate();
  const { currentUserId } = useRole();
  const tasks = useStore(state => state.tasks);
  const updateTaskStatus = useStore(state => state.updateTaskStatus);

  const projectTasks = tasks.filter(t => String(t.projectId) === String(projectId));
  const myTasks = projectTasks.filter(t => !t.assigneeId || String(t.assigneeId) === String(currentUserId) || String(t.assigneeId) === 'm2');

  const [activeTab, setActiveTab] = useState<"ALL" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE">("ALL");
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  const filteredTasks = myTasks.filter(t => {
    if (activeTab === "TODO") return t.status === "To Do";
    if (activeTab === "IN_PROGRESS") return t.status === "In Progress";
    if (activeTab === "REVIEW") return t.status === "In Review";
    if (activeTab === "DONE") return t.status === "Done";
    return true;
  });

  const handleQuickStatus = (taskId: string | number, newStatus: TaskStatus, taskTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    updateTaskStatus(taskId, newStatus);
    toast.success(`Moved "${taskTitle}" to ${newStatus}`);
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto px-6 sm:px-8 md:px-12 w-full py-10">
      {/* Monochrome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 dark:border-[#2C2C2C] pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            My Work • Task Execution Center
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            My Assigned Tasks
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Execute sprint deliverables, track deadlines, and transition work status with one click.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/projects/${projectId}/board`)}
            className="px-4 py-2 rounded-md bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-[#2C2C2C] font-medium text-xs transition-all shadow-sm"
          >
            Open Kanban Board →
          </button>
        </div>
      </div>

      {/* Tabs / Filter Bar */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-[#2C2C2C] rounded-md border border-gray-200 dark:border-[#2C2C2C]">
          {[
            { id: "ALL", label: `All Tasks (${myTasks.length})` },
            { id: "TODO", label: `To Do (${myTasks.filter(t => t.status === "To Do").length})` },
            { id: "IN_PROGRESS", label: `In Progress (${myTasks.filter(t => t.status === "In Progress").length})` },
            { id: "REVIEW", label: `In Review (${myTasks.filter(t => t.status === "In Review").length})` },
            { id: "DONE", label: `Completed (${myTasks.filter(t => t.status === "Done").length})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white dark:bg-[#191919] text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#191919] rounded-lg border border-dashed border-gray-200 dark:border-[#2C2C2C]">
            <CheckCircle2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">No tasks found in this section</h3>
            <p className="text-xs text-gray-500 mt-1">You are all caught up! Check the Kanban board for new assignments.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => setSelectedTask(task)}
                className="p-6 rounded-lg border border-gray-200 dark:border-[#2C2C2C] transition-all flex flex-col justify-between gap-5 bg-white dark:bg-[#191919] shadow-sm hover:shadow-md cursor-pointer group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug group-hover:underline">
                      {task.title}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 shrink-0">
                      {task.priority || "P1"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                    {task.dueDate && (
                      <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#2C2C2C] px-2 py-0.5 rounded border border-gray-200 dark:border-[#2C2C2C]">
                        <Clock className="w-3.5 h-3.5 text-gray-400" /> Due: {task.dueDate}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 font-medium text-xs border border-gray-200 dark:border-[#2C2C2C]">
                      Status: {task.status}
                    </span>
                  </div>
                </div>

                {/* One-Click Workflow Status Transitions & IDE Jump */}
                <div className="pt-4 border-t border-gray-200 dark:border-[#2C2C2C] flex items-center justify-between gap-3" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => navigate(`/projects/${projectId}/editor`)}
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <TerminalSquare className="w-3.5 h-3.5" /> Open Code IDE
                  </button>

                  <div className="flex items-center gap-2">
                    {task.status === "To Do" && (
                      <button
                        onClick={(e) => handleQuickStatus(task.id, "In Progress", task.title, e)}
                        className="px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs transition-opacity hover:opacity-90 shadow-sm flex items-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Task
                      </button>
                    )}
                    {task.status === "In Progress" && (
                      <button
                        onClick={(e) => handleQuickStatus(task.id, "In Review", task.title, e)}
                        className="px-3 py-1.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-xs transition-opacity hover:opacity-90 shadow-sm flex items-center gap-1.5"
                      >
                        <GitPullRequest className="w-3.5 h-3.5" /> Ready for Review
                      </button>
                    )}
                    {task.status !== "Done" && (
                      <button
                        onClick={(e) => handleQuickStatus(task.id, "Done", task.title, e)}
                        className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] hover:bg-gray-50 dark:hover:bg-[#2C2C2C] text-gray-900 dark:text-gray-100 font-medium text-xs transition-all shadow-sm flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" /> Mark Completed
                      </button>
                    )}
                    {task.status === "Done" && (
                      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-1 bg-gray-100 dark:bg-[#2C2C2C] px-3 py-1 rounded-md border border-gray-200 dark:border-[#2C2C2C]">
                        <CheckCheck className="w-4 h-4" /> Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        mode="detail"
        projectId={projectId}
        task={selectedTask}
      />
    </div>
  );
}
