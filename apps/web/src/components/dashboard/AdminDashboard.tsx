import React, { useState } from "react";
import { useStore, Priority } from "../../store/useStore";
import { Send, Plus, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { StatsGrid } from "./StatsGrid";
import { WorkspaceStats } from "./WorkspaceStats";
import { ActivitySection } from "./ActivitySection";

interface AdminDashboardProps {
  projectId: string;
}

export function AdminDashboard({ projectId }: AdminDashboardProps) {
  const navigate = useNavigate();
  const projects = useStore(state => state.projects);
  const tasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);
  const createTask = useStore(state => state.createTask);

  const project = projects.find(p => p.id === projectId) || projects[0];
  const projectTasks = tasks.filter(t => t.projectId === projectId);
  const projectMembers = Array.isArray(project?.members) && project.members.length > 0
    ? members.filter(m => project.members.includes(m.id))
    : members;

  const doneCount = projectTasks.filter(t => t.status === "Done").length;
  const totalTasks = projectTasks.length || 1;
  const completionRate = Math.round((doneCount / totalTasks) * 100);

  // Quick Assign Task State
  const [taskTitle, setTaskTitle] = useState("");
  const [selectedAssignee, setSelectedAssignee] = useState(projectMembers[0]?.id || "");
  const [selectedPriority, setSelectedPriority] = useState<Priority>("P1");
  const [selectedDueDate, setSelectedDueDate] = useState("Tomorrow");
  const [isDispatching, setIsDispatching] = useState(false);

  const handleDispatchTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    setIsDispatching(true);
    setTimeout(() => {
      createTask(projectId, taskTitle.trim(), selectedAssignee, selectedPriority, selectedDueDate);
      const assigneeName = members.find(m => m.id === selectedAssignee)?.name || "Team Member";
      toast.success(`Task dispatched to ${assigneeName}!`);
      setTaskTitle("");
      setIsDispatching(false);
    }, 400);
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Monochrome Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between py-8 border-b border-gray-200 dark:border-[#2C2C2C] gap-4">
        <div>
          <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em] mb-1">
            Project Space · Admin Workspace
          </div>
          <h1 className="text-[2.5rem] font-bold text-gray-900 dark:text-gray-100 tracking-[-0.03em] leading-tight">
            {project?.name}
          </h1>
          <p className="text-gray-500 text-[0.9rem] mt-1">
            Monitor project health, track velocity metrics, balance team workloads, and dispatch critical tasks.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate(`/projects/${projectId}/board`)}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md text-sm font-medium hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
          >
            Open Board
          </button>
          <button 
            onClick={() => navigate(`/projects/${projectId}/members`)}
            className="px-4 py-2 border border-gray-200 dark:border-[#2C2C2C] text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-[#191919]/50 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-2"
          >
            Manage Team
          </button>
        </div>
      </div>

      {/* Reused StatsGrid Component */}
      <StatsGrid
        firstValue={`${completionRate}%`}
        firstLabel="Sprint Completion Rate"
        secondValue={`${projectMembers.length}`}
        secondLabel="Active Contributors"
        thirdValue={`${projectTasks.length}`}
        thirdLabel="Total Project Tasks"
      />

      {/* Prominent Task Assignment Center (Monochrome Form) */}
      <div className="border border-gray-200 dark:border-[#2C2C2C] bg-white dark:bg-[#191919] rounded-lg p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-gray-200 dark:border-[#2C2C2C] pb-4">
          <div>
            <div className="text-[0.65rem] font-semibold text-gray-400 uppercase tracking-[0.12em]">Work Dispatcher</div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-0.5">Task Assignment Center</h2>
            <p className="text-xs text-gray-500 mt-1">
              Create new tasks, assign them directly to project members, set priorities and due dates, and dispatch work instantly.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded text-[10px] font-medium border border-gray-200 dark:border-[#2C2C2C] bg-gray-50 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 shrink-0 self-start md:self-center">
            Live Dispatcher Ready
          </span>
        </div>

        <form onSubmit={handleDispatchTask} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            {/* Task Title Input */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-500">
                Task Title / Description *
              </label>
              <input 
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="e.g., Implement OAuth2 authentication flow..."
                className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all text-sm placeholder:text-gray-400 shadow-sm"
              />
            </div>

            {/* Assignee Dropdown */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-500">
                Assign To Member
              </label>
              <select
                value={selectedAssignee}
                onChange={(e) => setSelectedAssignee(e.target.value)}
                className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all text-sm shadow-sm"
              >
                {projectMembers.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Dropdown */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-500">
                Due Date Target
              </label>
              <select
                value={selectedDueDate}
                onChange={(e) => setSelectedDueDate(e.target.value)}
                className="w-full bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-md px-3 py-2.5 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-600 transition-all text-sm shadow-sm"
              >
                <option value="Today">Today (Urgent)</option>
                <option value="Tomorrow">Tomorrow</option>
                <option value="In 3 days">In 3 days</option>
                <option value="Next Week">Next Week</option>
              </select>
            </div>
          </div>

          {/* Priority & Dispatch Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-gray-200 dark:border-[#2C2C2C]">
            <div className="flex items-center gap-3">
              <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-gray-500">Priority:</span>
              <div className="flex items-center gap-2">
                {(["P0", "P1", "P2"] as Priority[]).map((p) => {
                  const isSelected = selectedPriority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedPriority(p)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        isSelected 
                          ? "bg-gray-900 dark:bg-white text-white dark:text-black border-gray-900 dark:border-white shadow-sm" 
                          : "bg-transparent text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {p === "P0" ? "P0 Urgent" : p === "P1" ? "P1 High" : "P2 Normal"}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isDispatching}
              className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black font-medium text-sm rounded-md shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
            >
              <Send className={`w-4 h-4 ${isDispatching ? "animate-bounce" : ""}`} />
              {isDispatching ? "Dispatching..." : "Assign & Dispatch Task"}
            </button>
          </div>
        </form>
      </div>

      {/* Reused WorkspaceStats Component */}
      <div className="mb-12">
        <WorkspaceStats projectId={projectId} />
      </div>

      {/* Reused ActivitySection Component */}
      <div>
        <ActivitySection projectId={projectId} />
      </div>
    </div>
  );
}
