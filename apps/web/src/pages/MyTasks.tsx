import React, { useState, useRef } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { useRole } from "../context/RBACContext";
import { Clock, CheckCircle2, Circle, ListTodo, AlertCircle, Loader2, Calendar } from "lucide-react";
import { TaskModal } from "../components/dashboard/TaskModal";
import { useWorkspaceTasks, useUpdateTask } from "../hooks/useTasks";
import { useProjects } from "../hooks/useProjects";
import { useWorkspaces } from "../hooks/useWorkspaces"
import { useStore } from "../store/useStore";
import { toFrontendStatus } from "../store/useStore";

const statusMap: Record<string, string> = {
  "TO_DO": "To Do",
  "IN_PROGRESS": "In Progress",
  "IN_REVIEW": "In Review",
  "DONE": "Done"
};

export function MyTasks() {
  const { currentUserId } = useRole();

  const { activeWorkspaceId } = useStore();
  const { data: workspaces } = useWorkspaces();
  const activeWorkspaceObj = workspaces?.find(w => Number(w.id) === Number(activeWorkspaceId)) || workspaces?.[0];
  const workspaceId = activeWorkspaceObj?.id;

  const { data: allTasks = [], isLoading: isLoadingTasks } = useWorkspaceTasks(workspaceId);
  const { data: projects = [] } = useProjects(workspaceId);

  const { mutate: updateTask } = useUpdateTask();

  const [activeTab, setActiveTab] = useState<"ACTIVE" | "COMPLETED">("ACTIVE");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleDateContainerClick = () => {
    if (dateInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        try {
          dateInputRef.current.showPicker();
        } catch (e) {
          dateInputRef.current.focus();
        }
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const numericUserId = parseInt(currentUserId, 10);
  const myTasks = allTasks.filter(t => t.assigneeId === numericUserId);
  
  const activeTasks = myTasks.filter(t => t.status !== "Done");
  const completedTasks = myTasks.filter(t => t.status === "Done");

  let displayedTasks = activeTab === "ACTIVE" ? activeTasks : completedTasks;

  if (dateFilter) {
    displayedTasks = displayedTasks.filter(task => {
      if (!task.createdAt) return false;
      const taskDate = new Date(task.createdAt);
      const year = taskDate.getFullYear();
      const month = String(taskDate.getMonth() + 1).padStart(2, '0');
      const day = String(taskDate.getDate()).padStart(2, '0');
      const localDateStr = `${year}-${month}-${day}`;
      return localDateStr === dateFilter;
    });
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "In Progress": return <Clock className="w-5 h-5 text-blue-500" />;
      case "In Review": return <AlertCircle className="w-5 h-5 text-amber-500" />;
      default: return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <DashboardLayout title="My Tasks">
      <div className="flex flex-col bg-transparent text-gray-900 dark:text-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between px-8 pb-8 gap-4 flex-shrink-0 border-b border-gray-200 dark:border-gray-800/80">
          <div className="space-y-2">
            <h1 className="text-[2.25rem] font-bold tracking-tight text-gray-900 dark:text-white leading-tight flex items-center gap-3">
              <ListTodo className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              My Tasks
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              View and manage your assigned tasks. Reflect on your completed work.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div 
              className="flex items-center h-10 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-lg px-3 shadow-sm cursor-pointer"
              onClick={handleDateContainerClick}
            >
              <Calendar className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <input
                ref={dateInputRef}
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="bg-transparent text-sm text-gray-700 dark:text-gray-300 focus:outline-none cursor-pointer"
                placeholder="Filter by date"
                onClick={(e) => e.stopPropagation()}
              />
              {dateFilter && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateFilter("");
                  }}
                  className="ml-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            
            <div className="flex h-10 p-1 bg-gray-100 dark:bg-[#191919] rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
              <button
                onClick={() => setActiveTab("ACTIVE")}
                className={`px-4 h-full flex items-center justify-center rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "ACTIVE"
                    ? "bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Active Tasks
              </button>
              <button
                onClick={() => setActiveTab("COMPLETED")}
                className={`px-4 h-full flex items-center justify-center rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === "COMPLETED"
                    ? "bg-white dark:bg-[#2C2C2C] text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                Completed (Self Reflection)
              </button>
            </div>
          </div>
        </div>

        <div className="mt-8 px-8">
          <div className="bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-[#2C2C2C] shadow-sm overflow-hidden min-h-[300px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-200 dark:border-[#2C2C2C] bg-gray-50/50 dark:bg-[#191919]/50 text-[0.7rem] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-6 md:col-span-5">Task</div>
              <div className="col-span-6 md:col-span-4">Project & Details</div>
              <div className="col-span-12 md:col-span-3 text-right">Action</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100 dark:divide-[#2C2C2C]">
              {isLoadingTasks ? (
                <div className="px-6 py-12 text-center flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
                  <p className="text-sm">Loading tasks...</p>
                </div>
              ) : displayedTasks.length > 0 ? (
                displayedTasks.map(task => {
                  const project = projects.find(p => p.id === task.projectId);
                  const uiStatus = toFrontendStatus(task.status);
                  return (
                    <div 
                      key={task.id} 
                      onClick={() => setSelectedTask(task)}
                      className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 dark:hover:bg-[#191919] transition-colors group cursor-pointer"
                    >
                      <div className="col-span-6 md:col-span-5 flex items-start gap-3">
                        <div className="mt-0.5">
                          {getStatusIcon(uiStatus)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                              {task.description}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-6 md:col-span-4 flex flex-col justify-center">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {project?.name || "Unknown Project"}
                        </span>
                        {task.createdAt && (
                          <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            Posted: {formatDate(task.createdAt)}
                          </span>
                        )}
                      </div>
                      
                      <div className="col-span-12 md:col-span-3 flex items-center justify-end" onClick={e => e.stopPropagation()}>
                        {activeTab === "ACTIVE" ? (
                          <button
                            onClick={() => updateTask({ taskId: task.id, status: "DONE" })}
                            className="px-4 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Completed
                          </button>
                        ) : (
                          <button
                            onClick={() => updateTask({ taskId: task.id, status: "TO_DO" })}
                            className="px-4 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 shadow-sm border border-gray-300 dark:border-gray-700"
                          >
                            Not Completed
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6 text-gray-400" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {activeTab === "ACTIVE" ? "No active tasks" : "No completed tasks"}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {dateFilter 
                      ? "No tasks match the selected date filter."
                      : activeTab === "ACTIVE" 
                        ? "You're all caught up! Enjoy your free time." 
                        : "You haven't completed any tasks yet. Keep up the good work!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        mode="detail"
        task={selectedTask}
      />
    </DashboardLayout>
  );
}
