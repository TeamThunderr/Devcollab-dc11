import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/Dialog";
import { useStore, Task, Priority, TaskStatus, toFrontendStatus } from "../../store/useStore";
import { useRole } from "../../context/RBACContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Tag, User, AlertCircle, MessageSquare, Send, TerminalSquare, Check, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { CustomSelect } from "../ui/CustomSelect";

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "detail";
  projectId?: string | number;
  initialStatus?: TaskStatus;
  task?: Task | null;
}

interface Comment {
  id: string | number;
  userId: string | number;
  content: string;
  createdAt: string;
  user?: { name: string; avatarUrl?: string };
}

export function TaskModal({ isOpen, onClose, mode, projectId, initialStatus = "To Do", task }: TaskModalProps) {
  const navigate = useNavigate();
  const { role, currentUserId } = useRole();
  const isAdmin = role === "ADMIN" || (role as string) === "OWNER";
  
  const members = useStore(state => state.members);
  const projects = useStore(state => state.projects);
  const createTask = useStore(state => state.createTask);
  const updateTask = useStore(state => state.updateTask);
  const updateTaskStatus = useStore(state => state.updateTaskStatus);
  const deleteTask = useStore(state => state.deleteTask);

  const activeProjectId = projectId || task?.projectId || projects[0]?.id;
  const project = projects.find(p => String(p.id) === String(activeProjectId));
  
  // Deduplicate project members by id
  const projectMembers = React.useMemo(() => {
    const rawList = members.filter(m => !project || !project.members || project.members.includes(String(m.id)) || project.members.includes(Number(m.id)) || project.members.length === 0);
    const seen = new Set();
    return rawList.filter(m => {
      const stringId = String(m.id);
      if (seen.has(stringId)) return false;
      seen.add(stringId);
      return true;
    });
  }, [members, project]);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("To Do");
  const [priority, setPriority] = useState<Priority>("P1");
  const [assigneeId, setAssigneeId] = useState<string | number>("");
  const [dueDate, setDueDate] = useState("");
  const [estimatedTime, setEstimatedTime] = useState("");
  const [label, setLabel] = useState("Frontend");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Comments State (for detail mode)
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (mode === "detail" && task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus(toFrontendStatus(task.status || "To Do") as TaskStatus);
      setPriority(task.priority || "P1");
      setAssigneeId(task.assigneeId || "");
      setDueDate(task.dueDate ? (task.dueDate.split("T")[0] || "") : "");
      
      // Fetch real comments
      setIsLoadingComments(true);
      api.get<Comment[]>(`/api/tasks/${task.id}/comments`)
        .then(res => setComments(res.data || []))
        .catch(() => setComments([]))
        .finally(() => setIsLoadingComments(false));
    } else if (mode === "create") {
      setTitle("");
      setDescription("");
      setStatus(toFrontendStatus(initialStatus || "To Do") as TaskStatus);
      setPriority("P1");
      setAssigneeId(projectMembers[0]?.id || "");
      setDueDate(task?.dueDate ? (task.dueDate.split("T")[0] || "") : "");
      setEstimatedTime("2h");
      setLabel("Frontend");
      setComments([]);
    }
  }, [mode, task, isOpen, initialStatus]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a task title");
      return;
    }
    if (!isAdmin) {
      toast.error("Only Admins can create tasks");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullDesc = description + (estimatedTime || label ? `\n\n[Meta] Est: ${estimatedTime} | Tag: ${label}` : "");
      await createTask(activeProjectId!, title.trim(), assigneeId || undefined, priority, dueDate || undefined, fullDesc);
      toast.success("Task created successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    setIsSubmitting(true);
    try {
      if (isAdmin) {
        await updateTask(task.id, {
          title: title.trim(),
          description,
          status,
          priority,
          assigneeId: assigneeId || null,
          dueDate: dueDate || null,
        });
      } else {
        // Member can only update status
        await updateTaskStatus(task.id, status);
      }
      toast.success("Task updated successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to update task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !isAdmin) return;
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask(task.id);
      toast.success("Task deleted");
      onClose();
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !task) return;

    const commentText = newComment.trim();
    setNewComment("");

    // Optimistic comment
    const optimistic: Comment = {
      id: Math.random().toString(),
      userId: currentUserId,
      content: commentText,
      createdAt: new Date().toISOString(),
      user: { name: "You" }
    };
    setComments(prev => [...prev, optimistic]);

    try {
      const { data } = await api.post<Comment>(`/api/tasks/${task.id}/comments`, { content: commentText });
      setComments(prev => prev.map(c => c.id === optimistic.id ? data : c));
    } catch (err) {
      console.error("Failed to post comment to backend", err);
    }
  };

  const canEditFields = isAdmin && mode === "detail";
  const isReadOnly = !isAdmin && mode === "detail";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] text-gray-900 dark:text-gray-100 rounded-xl p-6 shadow-xl">
        <DialogHeader className="border-b border-gray-200 dark:border-[#2C2C2C] pb-4 mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
              {mode === "create" ? "Create New Task" : "Task Details"}
            </DialogTitle>
            {mode === "detail" && task && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { onClose(); navigate(`/projects/${activeProjectId}/editor`); }}
                  className="px-3 py-1 text-xs font-medium bg-gray-100 dark:bg-[#2C2C2C] hover:bg-gray-200 dark:hover:bg-[#3C3C3C] rounded-md flex items-center gap-1.5 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <TerminalSquare className="w-3.5 h-3.5" /> Open in Editor
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={mode === "create" ? handleCreate : handleUpdate} className="space-y-6">
          {/* Title Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Task Title *
            </label>
            <input
              type="text"
              required
              disabled={isReadOnly && mode === "detail"}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Implement OAuth2 authentication flow"
              className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-70 transition-all"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Description
            </label>
            <textarea
              rows={3}
              disabled={isReadOnly && mode === "detail"}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add detailed instructions, acceptance criteria, or context..."
              className="w-full px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white disabled:opacity-70 transition-all resize-y"
            />
          </div>

          {/* Grid of Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-[#111] rounded-lg border border-gray-200 dark:border-[#2C2C2C]">
            {/* Status (Everyone can edit status) */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Status
              </label>
              <CustomSelect
                value={status}
                onChange={val => setStatus(val as TaskStatus)}
                options={[
                  { value: "To Do", label: "To Do" },
                  { value: "In Progress", label: "In Progress" },
                  { value: "In Review", label: "In Review" },
                  { value: "Done", label: "Done" },
                ]}
              />
            </div>

            {/* Assignee (Only project members) */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3" /> Assignee
              </label>
              <CustomSelect
                disabled={isReadOnly && mode === "detail"}
                value={assigneeId}
                onChange={val => setAssigneeId(val)}
                placeholder="Unassigned"
                options={[
                  { value: "", label: "Unassigned" },
                  ...projectMembers.map(m => ({
                    value: m.id,
                    label: `${m.name} (${m.role})`,
                  })),
                ]}
              />
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="w-3 h-3" /> Priority
              </label>
              <CustomSelect
                disabled={isReadOnly && mode === "detail"}
                value={priority}
                onChange={val => setPriority(val as Priority)}
                options={[
                  { value: "P0", label: "P0 Urgent" },
                  { value: "P1", label: "P1 High" },
                  { value: "P2", label: "P2 Normal" },
                ]}
              />
            </div>

            {/* Due Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Due Date
              </label>
              <input
                type="date"
                disabled={isReadOnly && mode === "detail"}
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white dark:bg-[#191919] border border-gray-200 dark:border-[#2C2C2C] rounded text-xs text-gray-900 dark:text-white focus:outline-none font-medium disabled:opacity-70"
              />
            </div>

            {/* Estimated Time (for create mode / meta) */}
            {mode === "create" && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Est. Time
                </label>
                <CustomSelect
                  value={estimatedTime}
                  onChange={val => setEstimatedTime(val)}
                  options={[
                    { value: "1h", label: "1 Hour" },
                    { value: "2h", label: "2 Hours" },
                    { value: "4h", label: "4 Hours" },
                    { value: "1d", label: "1 Day" },
                    { value: "2d", label: "2 Days" },
                    { value: "1w", label: "1 Week" },
                  ]}
                />
              </div>
            )}

            {/* Label / Tag (for create mode / meta) */}
            {mode === "create" && (
              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category Label
                </label>
                <CustomSelect
                  value={label}
                  onChange={val => setLabel(val)}
                  options={[
                    { value: "Frontend", label: "Frontend" },
                    { value: "Backend", label: "Backend" },
                    { value: "Database", label: "Database" },
                    { value: "UI/UX", label: "UI/UX" },
                    { value: "DevOps", label: "DevOps" },
                    { value: "Bug", label: "Bug Fix" },
                  ]}
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-[#2C2C2C]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 dark:border-[#2C2C2C] text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2C2C2C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? "Saving..." : mode === "create" ? "Create Task" : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Comments Section (only in Detail Mode) */}
        {mode === "detail" && task && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-[#2C2C2C] space-y-4">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              Activity & Comments ({comments.length})
            </h4>

            {/* Comment List */}
            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
              {isLoadingComments ? (
                <div className="text-xs text-gray-400 text-center py-4">Loading comments...</div>
              ) : comments.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 dark:bg-[#111] rounded-lg border border-dashed border-gray-200 dark:border-[#2C2C2C]">
                  No comments yet. Start the conversation below!
                </div>
              ) : (
                comments.map((c, i) => (
                  <div key={c.id || i} className="p-3 bg-gray-50 dark:bg-[#111] rounded-lg border border-gray-100 dark:border-[#2C2C2C] space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-gray-900 dark:text-gray-200">
                        {c.user?.name || "Team Member"}
                      </span>
                      <span className="text-gray-400">
                        {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment Input */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-3 py-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#2C2C2C] rounded-lg text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white transition-all"
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1"
              >
                <Send className="w-3 h-3" /> Post
              </button>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
