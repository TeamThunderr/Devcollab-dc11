import { create } from 'zustand';
import { api } from '../lib/api';

export type ProjectStatus = 'active' | 'archived' | 'inactive' | string;
export type Priority = 'P0' | 'P1' | 'P2' | string;
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | string;

export function toFrontendStatus(status?: string | null): TaskStatus {
  if (!status) return 'To Do';
  const s = status.toUpperCase().replace(/[-\s]+/g, '_');
  if (s === 'TO_DO') return 'To Do';
  if (s === 'IN_PROGRESS') return 'In Progress';
  if (s === 'IN_REVIEW') return 'In Review';
  if (s === 'DONE') return 'Done';
  return status;
}

export function toBackendStatus(status?: string | null): string {
  if (!status) return 'TO_DO';
  const s = status.toUpperCase().replace(/[-\s]+/g, '_');
  if (s === 'TO_DO') return 'TO_DO';
  if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (s === 'IN_REVIEW') return 'IN_REVIEW';
  if (s === 'DONE') return 'DONE';
  return 'TO_DO';
}
export type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer' | 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER' | string;

export interface Project {
  id: string | number;
  workspaceId?: string | number;
  name: string;
  description: string | null;
  status: ProjectStatus;
  priority: Priority;
  tasksCount: number;
  lastEdited?: string;
  updatedAt?: string;
  createdAt?: string;
  members: (string | number)[];
}

export interface Task {
  id: string | number;
  projectId: string | number;
  title: string;
  description?: string | null;
  status: TaskStatus;
  assigneeId?: string | number | null;
  priority?: Priority;
  sprintId?: string | number | null;
  dueDate?: string | null;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string | number;
  _optimistic?: boolean;
  _optimisticAt?: number;
}

export interface Member {
  id: string | number;
  name: string;
  email: string;
  role: Role;
  joinedAt?: string;
  createdAt?: string;
  avatarUrl?: string | null;
  avatar?: string | null;
  status?: string;
}

export interface ActivityItem {
  id: string | number;
  workspaceId?: string | number;
  projectId?: string | number | null;
  userId: string | number;
  action?: string;
  actionType?: string;
  timestamp?: string;
  createdAt?: string;
  metadata?: any;
}

export type NotificationType = 'mention' | 'announcement' | 'assignment' | 'system' | 'MENTION' | 'ASSIGNMENT' | 'SYSTEM' | string;

export interface Notification {
  id: string | number;
  type: NotificationType;
  message: string;
  timestamp?: string;
  createdAt?: string;
  read?: boolean;
  isRead?: boolean;
  avatarUrl?: string;
  link?: string;
  targetUserId?: string | number;
  userId?: string | number;
}

export interface Snippet {
  id: string | number;
  projectId: string | number;
  title: string;
  code: string;
  language: string;
  category?: string;
  tags?: string[] | null;
  description?: string | null;
  authorId?: string | number;
  createdBy?: string | number;
  updatedAt?: string;
  createdAt?: string;
  pinned?: boolean;
}

export interface Doc {
  id: string | number;
  projectId: string | number;
  title: string;
  content: string;
  createdBy?: string | number;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkspaceState {
  // Data
  activeWorkspaceId: string | number | null;
  projects: Project[];
  tasks: Task[];
  members: Member[];
  activities: ActivityItem[];
  notifications: Notification[];
  snippets: Snippet[];
  docs: Doc[];
  sprints?: any[];
  
  workspace: { name: string; slug: string; description: string };
  profile: { name: string; bio: string; githubUrl: string; skills: string[] };
  preferences: {
    taskAssigned: boolean;
    mentions: boolean;
    dueDates: boolean;
    newMember: boolean;
    projectStatus: boolean;
  };

  // Actions
  createTask: (projectId: string | number, title: string, assigneeId?: string | number, priority?: Priority, dueDate?: string, description?: string, status?: TaskStatus) => Promise<Task | undefined>;
  updateTaskStatus: (taskId: string | number, status: TaskStatus) => Promise<void>;
  updateTaskAssignee: (taskId: string | number, assigneeId: string | number | null) => Promise<void>;
  updateTask: (taskId: string | number, data: Partial<Task>) => Promise<Task | undefined>;
  deleteTask: (taskId: string | number) => Promise<void>;
  
  addMember: (workspaceId: string | number, email: string, role: string, name?: string) => Promise<Member | undefined>;
  updateMemberRole: (memberId: string | number, role: string) => void;
  removeMember: (memberId: string | number) => void;
  removePendingInvitationByEmail: (email: string) => void;
  markAllNotificationsRead: () => Promise<void>;
  addActivity: (activity: ActivityItem) => void;
  updateWorkspace: (data: Partial<WorkspaceState['workspace']>) => void;
  setActiveWorkspace: (id: string | number | null) => void;
  updateProfile: (data: Partial<WorkspaceState['profile']>) => void;
  updatePreferences: (data: Partial<WorkspaceState['preferences']>) => void;

  saveSnippet: (snippet: Partial<Snippet> & { projectId: string | number; title: string; code: string; language: string }) => Promise<Snippet | undefined>;
  createSnippet: (...args: any[]) => Promise<Snippet | undefined>;
  updateSnippet: (id: string | number, snippet: any) => Promise<Snippet | undefined>;
  deleteSnippet: (id: string | number) => Promise<void>;
  togglePinSnippet: (id: string | number) => void;

  saveDoc: (doc: Partial<Doc> & { projectId: string | number; title: string; content: string }) => Promise<Doc | undefined>;
  createDoc: (...args: any[]) => Promise<Doc | undefined>;
  updateDoc: (id: string | number, doc: any) => Promise<Doc | undefined>;
  deleteDoc: (id: string | number) => Promise<void>;

  transitioningProject: { id: string | number; name: string } | null;
  triggerProjectTransition: (project: { id: string | number; name: string } | null) => void;

  syncFromBackend: (data: Partial<{
    projects: Project[];
    tasks: Task[];
    members: Member[];
    activities: ActivityItem[];
    notifications: Notification[];
    snippets: Snippet[];
    docs: Doc[];
    sprints?: any[];
  }>) => void;
}

export const useStore = create<WorkspaceState>((set, get) => ({
  projects: [],
  tasks: [],
  members: [],
  activities: [],
  notifications: [],
  snippets: [],
  docs: [],
  sprints: [],
  
  activeWorkspaceId: typeof window !== 'undefined' ? localStorage.getItem('activeWorkspaceId') : null,

  workspace: { name: '', slug: '', description: '' },
  profile: { name: '', bio: '', githubUrl: '', skills: [] },
  preferences: {
    taskAssigned: true,
    mentions: true,
    dueDates: false,
    newMember: true,
    projectStatus: false,
  },
  transitioningProject: null,
  triggerProjectTransition: (project) => set({ transitioningProject: project }),

  createTask: async (projectId, title, assigneeId, priority = 'P1', dueDate, description, status) => {
    try {
      const payload: any = {
        title,
        status: status ? toBackendStatus(status) : 'TO_DO',
        priority,
        description: description || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeId: assigneeId ? Number(assigneeId) : undefined,
      };
      const { data: newTask } = await api.post<Task>(`/api/projects/${projectId}/tasks`, payload);
      const formattedTask = { ...newTask, status: toFrontendStatus(newTask.status) };
      set((state) => ({
        tasks: [formattedTask, ...state.tasks],
        projects: state.projects.map(p => String(p.id) === String(projectId) ? { ...p, tasksCount: (p.tasksCount || 0) + 1 } : p),
      }));
      return formattedTask;
    } catch (err) {
      console.error("Failed to create task in backend:", err);
      throw err;
    }
  },

  updateTaskStatus: async (taskId, status) => {
    const task = get().tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;
    const prevStatus = task.status;
    const prevCompletedAt = task.completedAt;
    const prevActivities = get().activities;

    set((state) => ({
      tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { 
        ...t, 
        status: toFrontendStatus(status),
        completedAt: toFrontendStatus(status) === 'Done' ? new Date().toISOString() : t.completedAt,
        _optimistic: true,
        _optimisticAt: Date.now()
      } : t)
    }));
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: task.projectId,
      userId: task.assigneeId || 'm1',
      action: `moved "${task.title}" to ${toFrontendStatus(status)}`,
      timestamp: new Date().toISOString()
    };
    set((state) => ({ activities: [newActivity, ...state.activities] }));

    try {
      await api.patch(`/api/tasks/${taskId}`, { status: toBackendStatus(status) });
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, _optimistic: false } : t)
      }));
    } catch (err: any) {
      console.error("Failed to update task status in backend, rolling back:", err);
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, status: prevStatus, completedAt: prevCompletedAt, _optimistic: false } : t),
        activities: prevActivities
      }));
      throw err;
    }
  },

  updateTaskAssignee: async (taskId, assigneeId) => {
    const task = get().tasks.find(t => String(t.id) === String(taskId));
    if (!task) return;
    const prevAssigneeId = task.assigneeId;

    set((state) => ({
      tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, assigneeId, _optimistic: true, _optimisticAt: Date.now() } : t)
    }));
    try {
      await api.patch(`/api/tasks/${taskId}`, { assigneeId: assigneeId ? Number(assigneeId) : null });
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, _optimistic: false } : t)
      }));
    } catch (err: any) {
      console.error("Failed to update task assignee in backend, rolling back:", err);
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, assigneeId: prevAssigneeId, _optimistic: false } : t)
      }));
      throw err;
    }
  },

  updateTask: async (taskId, data) => {
    const task = get().tasks.find(t => String(t.id) === String(taskId));
    if (!task) return task;
    const prevTask = { ...task };

    set((state) => ({
      tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...t, ...data, ...(data.status ? { status: toFrontendStatus(data.status) } : {}), _optimistic: true, _optimisticAt: Date.now() } : t)
    }));
    try {
      const payload: any = { ...data };
      if (payload.status) payload.status = toBackendStatus(payload.status);
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
      if (payload.assigneeId !== undefined) payload.assigneeId = payload.assigneeId ? Number(payload.assigneeId) : null;
      const { data: updatedTask } = await api.patch<Task>(`/api/tasks/${taskId}`, payload);
      const formattedTask = { ...updatedTask, status: toFrontendStatus(updatedTask.status), _optimistic: false };
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? formattedTask : t)
      }));
      return formattedTask;
    } catch (err: any) {
      console.error("Failed to update task in backend, rolling back:", err);
      set((state) => ({
        tasks: state.tasks.map(t => String(t.id) === String(taskId) ? { ...prevTask, _optimistic: false } : t)
      }));
      throw err;
    }
  },

  deleteTask: async (taskId) => {
    const task = get().tasks.find(t => String(t.id) === String(taskId));
    const prevTasks = get().tasks;
    const prevProjects = get().projects;

    set((state) => ({
      tasks: state.tasks.filter(t => String(t.id) !== String(taskId)),
      projects: task ? state.projects.map(p => String(p.id) === String(task.projectId) ? { ...p, tasksCount: Math.max(0, (p.tasksCount || 1) - 1) } : p) : state.projects,
    }));
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch (err: any) {
      console.error("Failed to delete task in backend, rolling back:", err);
      set({
        tasks: prevTasks,
        projects: prevProjects,
      });
      throw err;
    }
  },

  addMember: async (workspaceId, email, role, name) => {
    const memberName = name || email.split('@')[0] || 'Team Member';
    const newId = 'm_' + Math.random().toString(36).substr(2, 6);
    const newMember: Member = {
      id: newId,
      name: memberName,
      email: email,
      role: role as any,
      joinedAt: new Date().toISOString(),
      avatarUrl: `https://api.dicebear.com/7.x/notionists/svg?seed=${memberName}`,
      status: 'Pending'
    };
    set((state) => ({ members: [...state.members, newMember] }));
    const newActivity: ActivityItem = {
      id: Math.random().toString(36).substr(2, 9),
      projectId: 'p1',
      userId: 'm1',
      action: `invited ${memberName} (${email}) as ${role}`,
      timestamp: new Date().toISOString()
    };
    const newNotif: Notification = {
      id: 'n_' + Math.random().toString(36).substr(2, 6),
      type: 'assignment',
      message: `You invited ${memberName} to workspace`,
      timestamp: 'Just now',
      read: false,
      isRead: false,
      avatarUrl: newMember.avatarUrl || undefined
    };
    set((state) => ({ 
      activities: [newActivity, ...state.activities],
      notifications: [newNotif, ...state.notifications]
    }));
    try {
      if (!isNaN(Number(workspaceId))) {
        const { data } = await api.post(`/api/workspaces/${workspaceId}/invite`, {
          email,
          role: role.toUpperCase()
        });
        
        // If data is a member object (has userId), it means the user was added immediately
        if (data && (data.userId || data.status === 'Active')) {
          set(state => ({
            members: state.members.map(m => m.id === newId ? { ...m, status: 'Active' } : m)
          }));
        } else if (data && data.status === 'Pending') {
          set(state => ({
            members: state.members.map(m => m.id === newId ? { ...m, status: 'Pending' } : m)
          }));
        }
        
        return data;
      }
    } catch (err) {
      console.error("Failed to add member in backend, using local state", err);
    }
    return newMember;
  },

  updateMemberRole: async (memberId, role) => {
    const uppercaseRole = role.toUpperCase();
    const wsId = get().activeWorkspaceId || 1;
    const previousMembers = get().members;
    const member = previousMembers.find(m => String(m.id) === String(memberId) || String((m as any).userId) === String(memberId));
    
    set((state) => ({
      members: state.members.map(m => (String(m.id) === String(memberId) || String((m as any).userId) === String(memberId)) ? { ...m, role: uppercaseRole } : m)
    }));

    if (member) {
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: null,
        userId: 'm1',
        action: `updated role of ${member.name} to ${uppercaseRole}`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
    }
    try {
      if (memberId !== undefined && memberId !== null) {
        await api.patch(`/api/workspaces/${wsId}/members/${memberId}`, { role: uppercaseRole });
      }
    } catch (err) {
      console.error("Failed to update member role in backend, reverting local state", err);
      set({ members: previousMembers });
      throw err;
    }
  },

  removeMember: async (memberId) => {
    const wsId = get().activeWorkspaceId || 1;
    const member = get().members.find(m => String(m.id) === String(memberId) || String((m as any).userId) === String(memberId));
    set((state) => ({
      members: state.members.filter(m => String(m.id) !== String(memberId) && String((m as any).userId) !== String(memberId))
    }));
    if (member) {
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: null,
        userId: 'm1',
        action: `removed ${member.name} from workspace`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
    }
    try {
      if (memberId !== undefined && memberId !== null) {
        await api.delete(`/api/workspaces/${wsId}/members/${memberId}`);
      }
    } catch (err) {
      console.error("Failed to remove member in backend", err);
      throw err;
    }
  },

  removePendingInvitationByEmail: (email: string) => {
    set((state) => ({
      members: state.members.filter(m => !(m.email === email && m.status === 'Pending'))
    }));
  },

  markAllNotificationsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true, isRead: true }))
    }));
    try {
      const activeWorkspaceId = get().activeWorkspaceId;
      if (activeWorkspaceId) {
        await api.patch(`/api/workspaces/${activeWorkspaceId}/notifications/read-all`);
      }
    } catch (err) {
      console.error("Failed to mark notifications read in backend", err);
    }
  },

  addActivity: (activity) => set((state) => ({
    activities: [activity, ...state.activities]
  })),

  updateWorkspace: (data) => set((state) => ({
    workspace: { ...state.workspace, ...data }
  })),

  setActiveWorkspace: (id) => {
    if (typeof window !== 'undefined' && id !== null) {
      localStorage.setItem('activeWorkspaceId', String(id));
    } else if (typeof window !== 'undefined' && id === null) {
      localStorage.removeItem('activeWorkspaceId');
    }
    set({ activeWorkspaceId: id });
  },

  updateProfile: (data) => set((state) => ({
    profile: { ...state.profile, ...data }
  })),

  updatePreferences: (data) => set((state) => ({
    preferences: { ...state.preferences, ...data }
  })),

  createSnippet: (...args: any[]) => {
    if (args.length > 1) {
      return get().saveSnippet({ projectId: args[0], title: args[1], code: args[2], language: args[3], tags: args[4] });
    }
    return get().saveSnippet(args[0]);
  },
  updateSnippet: (id: any, data: any) => get().saveSnippet({ ...data, id }),
  createDoc: (...args: any[]) => {
    if (args.length > 1) {
      return get().saveDoc({ projectId: args[0], title: args[1], content: args[2] });
    }
    return get().saveDoc(args[0]);
  },
  updateDoc: (id: any, data: any) => get().saveDoc({ ...data, id }),

  saveSnippet: async (data) => {
    try {
      if (data.id && !String(data.id).startsWith('s_') && !isNaN(Number(data.id))) {
        const { data: updated } = await api.patch<Snippet>(`/api/snippets/${data.id}`, {
          title: data.title,
          code: data.code,
          language: data.language,
          tags: data.tags || (data.category ? [data.category] : undefined),
        });
        set((state) => ({
          snippets: state.snippets.map(s => String(s.id) === String(data.id) ? updated : s)
        }));
        const newActivity: ActivityItem = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: data.projectId || 'p1',
          userId: 'm1',
          action: `updated snippet "${data.title}"`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({ activities: [newActivity, ...state.activities] }));
        return updated;
      } else {
        const { data: created } = await api.post<Snippet>(`/api/projects/${data.projectId}/snippets`, {
          title: data.title,
          code: data.code,
          language: data.language,
          tags: data.tags || (data.category ? [data.category] : undefined),
        });
        set((state) => ({
          snippets: [created, ...state.snippets]
        }));
        const newActivity: ActivityItem = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: data.projectId || 'p1',
          userId: 'm1',
          action: `created snippet "${data.title}"`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({ activities: [newActivity, ...state.activities] }));
        return created;
      }
    } catch (err) {
      console.error("Failed to save snippet in backend, using local state", err);
      const newSnip: Snippet = {
        ...data,
        id: data.id || 's_' + Math.random().toString(36).substr(2, 9),
        updatedAt: 'Just now'
      } as Snippet;
      set((state) => ({
        snippets: data.id ? state.snippets.map(s => String(s.id) === String(data.id) ? newSnip : s) : [newSnip, ...state.snippets]
      }));
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: data.projectId || 'p1',
        userId: 'm1',
        action: `${data.id ? 'updated' : 'created'} snippet "${data.title}"`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
      return newSnip;
    }
  },

  deleteSnippet: async (id) => {
    const snip = get().snippets.find(s => String(s.id) === String(id));
    set((state) => ({
      snippets: state.snippets.filter(s => String(s.id) !== String(id))
    }));
    if (snip) {
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: snip.projectId || 'p1',
        userId: 'm1',
        action: `deleted snippet "${snip.title}"`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
    }
    try {
      if (!String(id).startsWith('s_') && !isNaN(Number(id))) {
        await api.delete(`/api/snippets/${id}`);
      }
    } catch (err) {
      console.error("Failed to delete snippet in backend", err);
    }
  },

  togglePinSnippet: (id) => set((state) => ({
    snippets: state.snippets.map(s => String(s.id) === String(id) ? { ...s, pinned: !s.pinned } : s)
  })),

  saveDoc: async (data) => {
    try {
      if (data.id && !String(data.id).startsWith('d_') && !isNaN(Number(data.id))) {
        const { data: updated } = await api.patch<Doc>(`/api/docs/${data.id}`, {
          title: data.title,
          content: data.content,
        });
        set((state) => ({
          docs: state.docs.map(d => String(d.id) === String(data.id) ? updated : d)
        }));
        const newActivity: ActivityItem = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: data.projectId || 'p1',
          userId: 'm1',
          action: `updated wiki page "${data.title}"`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({ activities: [newActivity, ...state.activities] }));
        return updated;
      } else {
        const { data: created } = await api.post<Doc>(`/api/projects/${data.projectId}/docs`, {
          title: data.title,
          content: data.content,
        });
        set((state) => ({
          docs: [created, ...state.docs]
        }));
        const newActivity: ActivityItem = {
          id: Math.random().toString(36).substr(2, 9),
          projectId: data.projectId || 'p1',
          userId: 'm1',
          action: `created wiki page "${data.title}"`,
          timestamp: new Date().toISOString()
        };
        set((state) => ({ activities: [newActivity, ...state.activities] }));
        return created;
      }
    } catch (err) {
      console.error("Failed to save doc in backend, using local state", err);
      const newDoc: Doc = {
        ...data,
        id: data.id || 'd_' + Math.random().toString(36).substr(2, 9),
        updatedAt: 'Just now'
      } as Doc;
      set((state) => ({
        docs: data.id ? state.docs.map(d => String(d.id) === String(data.id) ? newDoc : d) : [newDoc, ...state.docs]
      }));
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: data.projectId || 'p1',
        userId: 'm1',
        action: `${data.id ? 'updated' : 'created'} wiki page "${data.title}"`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
      return newDoc;
    }
  },

  deleteDoc: async (id) => {
    const doc = get().docs.find(d => String(d.id) === String(id));
    set((state) => ({
      docs: state.docs.filter(d => String(d.id) !== String(id))
    }));
    if (doc) {
      const newActivity: ActivityItem = {
        id: Math.random().toString(36).substr(2, 9),
        projectId: doc.projectId || 'p1',
        userId: 'm1',
        action: `deleted wiki page "${doc.title}"`,
        timestamp: new Date().toISOString()
      };
      set((state) => ({ activities: [newActivity, ...state.activities] }));
    }
    try {
      if (!String(id).startsWith('d_') && !isNaN(Number(id))) {
        await api.delete(`/api/docs/${id}`);
      }
    } catch (err) {
      console.error("Failed to delete doc in backend", err);
    }
  },

  syncFromBackend: (data) => set((state) => ({
    projects: data.projects !== undefined ? data.projects : state.projects,
    tasks: data.tasks !== undefined ? data.tasks.map(t => ({ ...t, status: toFrontendStatus(t.status) })) : state.tasks,
    members: data.members !== undefined ? data.members : state.members,
    activities: data.activities !== undefined ? data.activities : state.activities,
    notifications: data.notifications !== undefined ? data.notifications : state.notifications,
    snippets: data.snippets !== undefined ? data.snippets : state.snippets,
    docs: data.docs !== undefined ? data.docs : state.docs,
  })),
}));

