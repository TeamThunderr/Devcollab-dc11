import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { Kanban, List, Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "../context/RBACContext";
import { getProjectPermissions } from "../lib/projectPermissions";
import { useTasks } from "../hooks/useTasks";
import { useStore, Task, Member, TaskStatus, toFrontendStatus } from "../store/useStore";
import { TaskModal } from "../components/dashboard/TaskModal";
import { CalendarView } from "../components/dashboard/CalendarView";

function TaskCard({ task, member, onClick }: { task: Task; member?: Member; onClick: () => void }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const { role } = useRole();
  const perms = getProjectPermissions(role);

  return (
    <div
      onClick={onClick}
      draggable={perms.canCollaborate}
      onDragStart={(e) => {
        if (!perms.canCollaborate) {
          e.preventDefault();
          return;
        }
        e.dataTransfer.setData("taskId", task.id.toString());
        setIsDragging(true);
      }}
      onDragEnd={() => perms.canCollaborate && setIsDragging(false)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-lg p-3 flex flex-col gap-2.5 shadow-sm transition-all duration-150 select-none ${
        perms.canCollaborate ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${
        isDragging ? "opacity-50 scale-[0.98]" : isHovered ? "border-gray-400 dark:border-[#444444] shadow-md -translate-y-0.5" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium text-gray-900 dark:text-gray-100 leading-snug">
          {task.title}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2C2C2C] mt-0.5 text-[11px]">
        <div className="flex items-center gap-1.5 font-mono text-[10px]">
          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold border border-gray-200 dark:border-gray-700/60">
            {task.priority || "P1"}
          </span>
          <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#2C2C2C] text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-[#3C3C3C]">
            Task
          </span>
        </div>

        {member ? (
          <img
            src={member.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${member.name}`}
            alt={member.name}
            title={`Assigned to ${member.name}`}
            className="w-5 h-5 rounded-full border border-gray-200 dark:border-[#3C3C3C] bg-gray-100 shrink-0 object-cover"
          />
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-gray-300 dark:border-[#3C3C3C] flex items-center justify-center text-[9px] text-gray-400">
            —
          </div>
        )}
      </div>
    </div>
  );
}

export function Board() {
  const { projectId } = useParams();
  const [view, setView] = useState<"board" | "list" | "calendar">("board");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  // Modal states
  const [modalMode, setModalMode] = useState<"create" | "detail" | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [createCol, setCreateCol] = useState<TaskStatus>("To Do");

  const { role } = useRole();
  const perms = getProjectPermissions(role);

  const parsedId = parseInt(projectId || "0", 10);
  const { data: queryTasks = [] } = useTasks(parsedId);
  const storeTasks = useStore(state => state.tasks);
  const members = useStore(state => state.members);
  const updateTaskStatus = useStore(state => state.updateTaskStatus);

  // Merge tasks: Prefer queryTasks (real backend tasks), but include any storeTasks that are created locally (not yet in queryTasks) to support optimistic creation
  const displayTasks = useMemo(() => {
    const tasksMap = new Map(queryTasks.map((t: any) => [String(t.id), { ...t, status: toFrontendStatus(t.status) }]));
    const matchingStoreTasks = storeTasks.filter(t => String(t.projectId) === String(projectId) || String(t.projectId) === String(parsedId));
    matchingStoreTasks.forEach(t => {
      if (!tasksMap.has(String(t.id))) {
        tasksMap.set(String(t.id), { ...t, status: toFrontendStatus(t.status) });
      } else {
        const existing = tasksMap.get(String(t.id));
        if (existing && t.status) {
          tasksMap.set(String(t.id), { ...existing, status: toFrontendStatus(t.status) });
        }
      }
    });
    return Array.from(tasksMap.values());
  }, [queryTasks, storeTasks, projectId, parsedId]);

  const columns: TaskStatus[] = ["To Do", "In Progress", "In Review", "Done"];

  return (
    <div className="h-full flex flex-col bg-[#FBFBFA] dark:bg-[#09090b] text-gray-900 dark:text-gray-100">
      {/* Page Header */}
      <div className="flex items-start justify-between p-8 border-b border-gray-200 dark:border-[#2C2C2C] flex-shrink-0 bg-white dark:bg-[#111111]">
        <div className="space-y-2">
          <h1 className="text-[2.25rem] font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
            Tasks
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Manage and track your sprint deliverables.
          </p>
        </div>
        
        <div className="flex items-center gap-3 mt-1">
          {/* View Segmented Toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#191919] p-1 rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
            <button 
              onClick={() => setView("board")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                view === "board" 
                  ? "bg-white dark:bg-[#2C2C2C] shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Kanban className="w-3.5 h-3.5" /> Board
            </button>
            <button 
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                view === "list" 
                  ? "bg-white dark:bg-[#2C2C2C] shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <List className="w-3.5 h-3.5" /> List
            </button>
            <button 
              onClick={() => setView("calendar")}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-2 transition-all ${
                view === "calendar" 
                  ? "bg-white dark:bg-[#2C2C2C] shadow-sm text-gray-900 dark:text-white" 
                  : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Calendar
            </button>
          </div>

          {/* New Task Action — Only Admins/Owners */}
          {perms.canCreateTask && (
            <button 
              onClick={() => { setCreateCol("To Do"); setModalMode("create"); }}
              className="flex items-center gap-1.5 bg-gray-900 hover:bg-black text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 px-3.5 py-2 rounded-lg text-xs font-medium shadow-sm transition-all active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" /> New Task
            </button>
          )}
        </div>
      </div>

      {/* Main Board Content */}
      <div className="flex-1 overflow-x-auto p-8">
        {view === "board" && (
          <div className="flex gap-6 h-full items-start min-w-max pb-8">
            {columns.map((col) => {
              const colTasks = displayTasks.filter(t => toFrontendStatus(t.status) === col);
              const isDragOver = dragOverCol === col;

              return (
                <div 
                  key={col} 
                  onDragOver={(e) => { e.preventDefault(); setDragOverCol(col); }}
                  onDragLeave={() => setDragOverCol(null)}
                  onDrop={async (e) => {
                    const taskId = e.dataTransfer.getData("taskId");
                    if (taskId) {
                      try {
                        await updateTaskStatus(taskId, col);
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Cannot move task: dependency unfinished");
                      }
                    }
                    setDragOverCol(null);
                  }}
                  className="w-80 flex-shrink-0 flex flex-col bg-gray-50/70 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-800/80 p-3 max-h-full shadow-sm"
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {col}
                      </span>
                      <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-[#2C2C2C] px-2 py-0.5 rounded-full">
                        {colTasks.length}
                      </span>
                    </div>

                    {perms.canCreateTask && (
                      <button
                        onClick={() => { setCreateCol(col); setModalMode("create"); }}
                        className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-[#2C2C2C] transition-colors"
                        title="Add task"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Tasks List or Empty Placeholder */}
                  <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto custom-scrollbar pr-0.5 min-h-[100px]">
                    {colTasks.length > 0 ? (
                      colTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          member={members.find(m => String(m.id) === String(t.assigneeId))}
                          onClick={() => { setSelectedTask(t); setModalMode("detail"); }}
                        />
                      ))
                    ) : (
                      <div className={`flex-1 min-h-[100px] border border-dashed rounded-lg flex items-center justify-center transition-all duration-150 ${
                        isDragOver 
                          ? "border-gray-400 dark:border-[#444444] bg-gray-100 dark:bg-[#191919]" 
                          : "border-gray-200 dark:border-[#2C2C2C]"
                      }`}>
                        <span className="text-xs text-gray-400 dark:text-gray-600">No tasks</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {view === "list" && (
          <div className="max-w-4xl mx-auto space-y-3">
            {displayTasks.length > 0 ? (
              displayTasks.map(t => {
                const mem = members.find(m => String(m.id) === String(t.assigneeId));
                return (
                  <div
                    key={t.id}
                    onClick={() => { setSelectedTask(t); setModalMode("detail"); }}
                    className="p-4 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded-xl flex items-center justify-between cursor-pointer hover:border-gray-400 dark:hover:border-gray-600 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 dark:bg-[#2C2C2C] rounded border border-gray-200 dark:border-[#3C3C3C]">
                        {t.priority || "P1"}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.title}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      {mem && <span className="text-xs text-gray-500">{mem.name}</span>}
                      <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-[#2C2C2C]">
                        {toFrontendStatus(t.status)}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border border-dashed border-gray-200 dark:border-[#2C2C2C] rounded-xl p-12 text-center bg-white dark:bg-[#111111] shadow-xs">
                <List className="w-8 h-8 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 font-sans">No tasks found</h3>
                <p className="text-xs text-gray-500 mt-1">Get started by creating a new task.</p>
              </div>
            )}
          </div>
        )}

        {view === "calendar" && (
          <CalendarView
            tasks={displayTasks}
            members={members}
            canCreateTask={perms.canCreateTask}
            onOpenTaskDetail={(t) => {
              setSelectedTask(t);
              setModalMode("detail");
            }}
            onOpenCreateTask={(dateStr) => {
              setCreateCol("To Do");
              setSelectedTask(dateStr ? { dueDate: dateStr } as any : null);
              setModalMode("create");
            }}
          />
        )}
      </div>

      {/* Task Modal for Create / Detail */}
      <TaskModal
        isOpen={modalMode !== null}
        onClose={() => { setModalMode(null); setSelectedTask(null); }}
        mode={modalMode || "create"}
        projectId={parsedId || projectId}
        initialStatus={createCol}
        task={selectedTask}
      />
    </div>
  );
}

