import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStore, Project, Task, Member, ActivityItem, Notification, Snippet, Doc } from "../store/useStore";
import { api } from '../lib/api';
import { useSocket } from './useSocket';

export function useBackendSync() {
  const { currentUser } = useAuth();
  const socket = useSocket();

  const syncData = async () => {
    if (!currentUser) return;
    try {
      const { data: workspaces } = await api.get<any[]>('/api/workspaces').catch(() => ({ data: [] }));
      const activeWorkspaceId = useStore.getState().activeWorkspaceId;
      const activeWs = workspaces?.find((w: any) => Number(w.id) === Number(activeWorkspaceId)) || (workspaces && workspaces.length > 0 ? workspaces[0] : null);

      let projects: Project[] | undefined;
      let tasks: Task[] | undefined;
      let members: Member[] | undefined;
      let activities: ActivityItem[] | undefined;
      let snippets: Snippet[] = [];
      let docs: Doc[] = [];

      if (activeWs) {
        const wsId = activeWs.id;
        
        // Fetch projects, tasks, members, activity in parallel
        const [projRes, taskRes, memRes, actRes] = await Promise.all([
          api.get<any[]>(`/api/workspaces/${wsId}/projects`).catch(() => ({ data: undefined })),
          api.get<Task[]>(`/api/workspaces/${wsId}/tasks`).catch(() => ({ data: undefined })),
          api.get<any[]>(`/api/workspaces/${wsId}/members`).catch(() => ({ data: undefined })),
          api.get<ActivityItem[]>(`/api/workspaces/${wsId}/activity`).catch(() => ({ data: undefined })),
        ]);

        if (projRes.data) {
          projects = projRes.data.map((p: any) => ({
            id: p.id,
            workspaceId: p.workspaceId,
            name: p.name,
            description: p.description,
            status: p.status || 'active',
            priority: p.priority || 'P2',
            tasksCount: p.tasksCount || 0,
            members: p.members ? p.members.map((m: any) => m.id) : [],
            createdAt: p.createdAt,
            updatedAt: p.updatedAt,
          }));
        }
        tasks = taskRes.data;
        if (memRes.data) {
          members = memRes.data.map((m: any) => ({
            id: m.id || m.userId,
            name: m.name || m.user?.name || 'Unknown User',
            email: m.email || m.user?.email || '',
            role: m.role || 'Member',
            joinedAt: m.joinedAt || m.createdAt || new Date().toISOString(),
            avatarUrl: m.avatarUrl || m.user?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${m.name || 'user'}`,
          }));
        }
        activities = actRes.data;

        // Fetch snippets and docs for each project
        if (projects && projects.length > 0) {
          const snipPromises = projects.map(p => api.get<Snippet[]>(`/api/projects/${p.id}/snippets`).catch(() => ({ data: [] })));
          const docPromises = projects.map(p => api.get<Doc[]>(`/api/projects/${p.id}/docs`).catch(() => ({ data: [] })));
          
          const snipResults = await Promise.all(snipPromises);
          const docResults = await Promise.all(docPromises);
          
          snipResults.forEach(r => { if (r.data) snippets.push(...r.data); });
          docResults.forEach(r => { if (r.data) docs.push(...r.data); });
        }
      }

      // Fetch Notifications
      const { data: notifications } = await api.get<Notification[]>('/api/me/notifications').catch(() => ({ data: undefined }));

      // Update Zustand store
      useStore.getState().syncFromBackend({
        projects,
        tasks,
        members,
        activities,
        notifications,
        snippets: snippets.length > 0 ? snippets : undefined,
        docs: docs.length > 0 ? docs : undefined,
      });
    } catch (err) {
      console.error("Failed to sync backend data into store:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      syncData();
    }
  }, [currentUser, useStore(state => state.activeWorkspaceId)]);

  // Listen for socket events to trigger re-sync and handle incoming invitation rejections
  useEffect(() => {
    if (!socket) return;

    const handleEvent = () => {
      syncData();
    };

    socket.on('task:created', handleEvent);
    socket.on('task:updated', handleEvent);
    socket.on('task:deleted', handleEvent);
    socket.on('comment:added', handleEvent);
    socket.on('doc:created', handleEvent);
    socket.on('doc:updated', handleEvent);
    socket.on('doc:deleted', handleEvent);
    socket.on('snippet:created', handleEvent);
    socket.on('snippet:updated', handleEvent);
    socket.on('snippet:deleted', handleEvent);
    socket.on('notification', handleEvent);
    socket.on('notification:new', handleEvent);
    socket.on('invitation:rejected', (payload: any) => {
      if (payload && payload.email) {
        useStore.getState().removePendingInvitationByEmail(payload.email);
      }
    });

    return () => {
      socket.off('task:created', handleEvent);
      socket.off('task:updated', handleEvent);
      socket.off('task:deleted', handleEvent);
      socket.off('comment:added', handleEvent);
      socket.off('doc:created', handleEvent);
      socket.off('doc:updated', handleEvent);
      socket.off('doc:deleted', handleEvent);
      socket.off('snippet:created', handleEvent);
      socket.off('snippet:updated', handleEvent);
      socket.off('snippet:deleted', handleEvent);
      socket.off('notification', handleEvent);
      socket.off('notification:new', handleEvent);
      socket.off('invitation:rejected');
    };
  }, [socket]);
}
